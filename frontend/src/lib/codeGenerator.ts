import type { AnyLayer, GraphEdge } from '../types/graph'
import type { Hyperparams } from '../components/HyperparamsPanel'

type Shape =
  | { type: 'image'; channels: number; height: number; width: number }
  | { type: 'vector'; size: number }

function topoSort(layers: Record<string, AnyLayer>, edges: GraphEdge[]): AnyLayer[] {
  const inputLayer = Object.values(layers).find(
    l => l.kind === 'Input' && !edges.some(e => e.target === l.id)
  )
  if (!inputLayer) return []
  const result: AnyLayer[] = []
  let current: string | undefined = inputLayer.id
  while (current) {
    const layer = layers[current]
    if (!layer) break
    result.push(layer)
    current = edges.find(e => e.source === current)?.target
  }
  return result
}

function convOutputDim(input: number, kernel: number, stride: number, padding: 'same' | 'valid'): number {
  if (padding === 'same') return Math.ceil(input / Math.max(1, stride))
  return Math.max(1, Math.floor((input - kernel) / Math.max(1, stride) + 1))
}

function poolOutputDim(input: number, kernel: number, stride: number, padding: number): number {
  return Math.max(1, Math.floor((input + 2 * padding - kernel) / Math.max(1, stride) + 1))
}

function samePadding(kernel: number): number {
  return Math.floor(kernel / 2)
}

export function generatePyTorchCode(
  layers: Record<string, AnyLayer>,
  edges: GraphEdge[],
  hyperparams?: Hyperparams
): string {
  const sorted = topoSort(layers, edges)
  if (sorted.length === 0) return '# Add layers to the canvas to generate code.'
  if (sorted[0].kind !== 'Input') return '# Connect an Input layer first.'

  const dataset = sorted[0].params.dataset ?? 'mnist'
  const isEmnist = dataset === 'emnist'
  const datasetLabel = isEmnist ? 'EMNIST Letters (A–Z, 26 classes)' : 'MNIST Digits (0–9, 10 classes)'

  // Shape tracking
  let shape: Shape = { type: 'image', channels: 1, height: 28, width: 28 }

  const initLines: string[] = []
  const fwdLines: string[] = []
  const counters: Record<string, number> = {}
  const cnt = (n: string) => { counters[n] = (counters[n] ?? 0) + 1; return counters[n] }
  let flattenAdded = false

  const ensureFlat = () => {
    if (shape.type === 'image') {
      if (!flattenAdded) {
        initLines.push(`        self.flatten = nn.Flatten()`)
        flattenAdded = true
      }
      fwdLines.push(`        x = self.flatten(x)`)
      const s = shape as Extract<Shape, { type: 'image' }>
      shape = { type: 'vector', size: s.channels * s.height * s.width }
    }
  }

  const activationInit = (act: string, suffix: string): string | null => {
    switch (act) {
      case 'relu':    return `nn.ReLU()`
      case 'sigmoid': return `nn.Sigmoid()`
      case 'tanh':    return `nn.Tanh()`
      case 'softmax': return `nn.Softmax(dim=1)`
      default:        return null
    }
  }

  for (const layer of sorted) {
    if (layer.kind === 'Input') {
      fwdLines.push(`        # x: (B, 1, 28, 28)  — ${datasetLabel}`)
      continue
    }

    if (layer.kind === 'Dense') {
      ensureFlat()
      const i = cnt('fc')
      const name = `fc${i}`
      const inF = (shape as Extract<Shape, { type: 'vector' }>).size
      initLines.push(`        self.${name} = nn.Linear(${inF}, ${layer.params.units})`)

      const act = layer.params.activation
      if (act && act !== 'none') {
        const actInit = activationInit(act, `${i}`)
        if (actInit) {
          const actName = `${act}${i}`
          initLines.push(`        self.${actName} = ${actInit}`)
          fwdLines.push(`        x = self.${actName}(self.${name}(x))`)
        } else {
          fwdLines.push(`        x = self.${name}(x)`)
        }
      } else {
        fwdLines.push(`        x = self.${name}(x)`)
      }
      shape = { type: 'vector', size: layer.params.units }
      continue
    }

    if (layer.kind === 'Convolution') {
      if (shape.type === 'vector') {
        const side = Math.round(Math.sqrt(shape.size))
        shape = { type: 'image', channels: 1, height: side, width: side }
      }
      if (shape.type !== 'image') continue
      const s = shape as Extract<Shape, { type: 'image' }>
      const { filters, kernel, stride, padding, activation } = layer.params
      const pad = padding === 'same' ? samePadding(kernel) : 0
      const i = cnt('conv')
      const name = `conv${i}`
      initLines.push(`        self.${name} = nn.Conv2d(${s.channels}, ${filters}, kernel_size=${kernel}, stride=${stride}, padding=${pad})`)

      const act = activation
      if (act && act !== 'none') {
        const actInit = activationInit(act, `${i}`)
        if (actInit) {
          const actName = `${act}${i}`
          initLines.push(`        self.${actName} = ${actInit}`)
          fwdLines.push(`        x = self.${actName}(self.${name}(x))`)
        } else {
          fwdLines.push(`        x = self.${name}(x)`)
        }
      } else {
        fwdLines.push(`        x = self.${name}(x)`)
      }
      const outH = convOutputDim(s.height, kernel, stride, padding)
      const outW = convOutputDim(s.width, kernel, stride, padding)
      shape = { type: 'image', channels: filters, height: outH, width: outW }
      continue
    }

    if (layer.kind === 'Pooling') {
      if (shape.type !== 'image') continue
      const s = shape as Extract<Shape, { type: 'image' }>
      const { pool_size, stride, padding } = layer.params
      const i = cnt('pool')
      const name = `pool${i}`
      const padVal = padding ?? 0
      initLines.push(`        self.${name} = nn.MaxPool2d(kernel_size=${pool_size}, stride=${stride}${padVal > 0 ? `, padding=${padVal}` : ''})`)
      fwdLines.push(`        x = self.${name}(x)`)
      const outH = poolOutputDim(s.height, pool_size, stride, padding ?? 0)
      const outW = poolOutputDim(s.width, pool_size, stride, padding ?? 0)
      shape = { type: 'image', channels: s.channels, height: outH, width: outW }
      continue
    }

    if (layer.kind === 'Flatten') {
      if (!flattenAdded) {
        initLines.push(`        self.flatten = nn.Flatten()`)
        flattenAdded = true
      }
      fwdLines.push(`        x = self.flatten(x)`)
      if (shape.type === 'image') {
        const s = shape as Extract<Shape, { type: 'image' }>
        shape = { type: 'vector', size: s.channels * s.height * s.width }
      }
      continue
    }

    if (layer.kind === 'Dropout') {
      const i = cnt('dropout')
      const name = `dropout${i}`
      initLines.push(`        self.${name} = nn.Dropout(p=${layer.params.rate})`)
      fwdLines.push(`        x = self.${name}(x)`)
      continue
    }

    if (layer.kind === 'BatchNorm') {
      const i = cnt('bn')
      const name = `bn${i}`
      if (shape.type === 'image') {
        initLines.push(`        self.${name} = nn.BatchNorm2d(${(shape as Extract<Shape, { type: 'image' }>).channels})`)
      } else if (shape.type === 'vector') {
        initLines.push(`        self.${name} = nn.BatchNorm1d(${(shape as Extract<Shape, { type: 'vector' }>).size})`)
      }
      fwdLines.push(`        x = self.${name}(x)`)
      continue
    }

    if (layer.kind === 'ResidualBlock') {
      if (shape.type !== 'image') continue
      const s = shape as Extract<Shape, { type: 'image' }>
      const { filters, kernel } = layer.params
      const k = kernel ?? 3
      const pad = Math.floor(k / 2)
      const i = cnt('resblock')
      const name = `resblock${i}`
      initLines.push(`        self.${name} = ResidualBlock(${s.channels}, ${filters}, kernel_size=${k})`)
      fwdLines.push(`        x = self.${name}(x)`)
      shape = { type: 'image', channels: filters, height: s.height, width: s.width }
      continue
    }

    if (layer.kind === 'Output') {
      ensureFlat()
      const inF = (shape as Extract<Shape, { type: 'vector' }>).size
      const i = cnt('fc')
      const name = `fc${i}`
      initLines.push(`        self.${name} = nn.Linear(${inF}, ${layer.params.classes})`)
      fwdLines.push(`        x = self.${name}(x)`)
      fwdLines.push(`        return x  # logits — CrossEntropyLoss applies softmax internally`)
      shape = { type: 'vector', size: layer.params.classes }
      continue
    }
  }

  const hasResBlock = counters['resblock'] > 0

  // If no return was added yet
  if (!fwdLines.some(l => l.includes('return'))) {
    fwdLines.push(`        return x`)
  }

  // Training setup
  const lr = hyperparams?.optimizer?.lr ?? 0.001
  const optType = hyperparams?.optimizer?.type ?? 'adam'
  const momentum = hyperparams?.optimizer?.momentum ?? 0.9
  const epochs = hyperparams?.epochs ?? 10
  const batchSize = hyperparams?.batch_size ?? 64

  const optimizerLine =
    optType === 'sgd'
      ? `torch.optim.SGD(model.parameters(), lr=${lr}, momentum=${momentum})`
      : optType === 'rmsprop'
      ? `torch.optim.RMSprop(model.parameters(), lr=${lr})`
      : `torch.optim.Adam(model.parameters(), lr=${lr})`

  const datasetBlock = isEmnist
    ? `from torch.utils.data import Dataset

class EMNISTLetters(Dataset):
    """EMNIST Letters with corrected labels (0-25) and transposed images."""
    def __init__(self, train=True):
        self.dataset = datasets.EMNIST(
            root="./data", split="letters", train=train, download=True, transform=transform
        )

    def __len__(self):
        return len(self.dataset)

    def __getitem__(self, idx):
        image, label = self.dataset[idx]
        image = torch.transpose(image, 1, 2)  # Fix EMNIST rotation
        return image, label - 1               # Remap 1-26 → 0-25`
    : null

  const datasetInit = isEmnist
    ? `EMNISTLetters(train=True)`
    : `datasets.MNIST(root="./data", train=True, download=True, transform=transform)`

  return `import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

# ── Dataset: ${datasetLabel} ──────────────────────────
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5,), (0.5,)),
])
${datasetBlock ? '\n' + datasetBlock + '\n' : ''}
${hasResBlock ? `

# ── Residual Block ───────────────────────────────────
class ResidualBlock(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size=3):
        super().__init__()
        padding = kernel_size // 2
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size, padding=padding)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size, padding=padding)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.skip = nn.Conv2d(in_channels, out_channels, 1) if in_channels != out_channels else nn.Identity()
        self.relu = nn.ReLU()

    def forward(self, x):
        identity = self.skip(x)
        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        return self.relu(out + identity)
` : ''}

# ── Model ─────────────────────────────────────────────
class NeuralNetwork(nn.Module):
    def __init__(self):
        super().__init__()
${initLines.join('\n')}

    def forward(self, x):
${fwdLines.join('\n')}


model = NeuralNetwork()
print(model)

# ── Training setup ────────────────────────────────────
optimizer = ${optimizerLine}
criterion = nn.CrossEntropyLoss()


def train(model, loader, optimizer, criterion, epochs=${epochs}):
    model.train()
    for epoch in range(1, epochs + 1):
        total_loss, correct, total = 0.0, 0, 0
        for x, y in loader:
            optimizer.zero_grad()
            out = model(x)
            loss = criterion(out, y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            correct += (out.argmax(1) == y).sum().item()
            total += len(y)
        acc = 100.0 * correct / total
        print(f"Epoch {epoch:>2}/{epochs}  loss={total_loss / len(loader):.4f}  acc={acc:.1f}%")


# ── Run ───────────────────────────────────────────────
if __name__ == "__main__":
    train_data = ${datasetInit}
    loader = DataLoader(train_data, batch_size=${batchSize}, shuffle=True)
    train(model, loader, optimizer, criterion)
`
}

// ── Simple syntax highlighter ─────────────────────────────────────────────────

const KEYWORDS = new Set([
  'import', 'from', 'class', 'def', 'return', 'for', 'if', 'else', 'elif',
  'in', 'not', 'and', 'or', 'as', 'with', 'True', 'False', 'None', 'pass',
  'raise', 'while', 'break', 'continue', 'lambda', 'yield', 'try', 'except',
  'finally', 'super', 'self',
])

export function highlightPython(code: string): string {
  return code
    .split('\n')
    .map(line => highlightLine(line))
    .join('\n')
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightLine(line: string): string {
  // Whole-line comment
  const commentMatch = line.match(/^(\s*)(#.*)$/)
  if (commentMatch) {
    return esc(commentMatch[1]) + `<span style="color:#6a9955">${esc(commentMatch[2])}</span>`
  }

  // Inline comment: split at first #
  let main = line
  let commentSuffix = ''
  const commentIdx = line.indexOf('#')
  if (commentIdx !== -1) {
    // Make sure it's not inside a string (simple heuristic)
    const before = line.slice(0, commentIdx)
    const singleQ = (before.match(/'/g) || []).length
    const doubleQ = (before.match(/"/g) || []).length
    if (singleQ % 2 === 0 && doubleQ % 2 === 0) {
      main = line.slice(0, commentIdx)
      commentSuffix = `<span style="color:#6a9955">${esc(line.slice(commentIdx))}</span>`
    }
  }

  // Tokenize main part: strings, words, numbers, symbols
  const out: string[] = []
  let i = 0
  while (i < main.length) {
    // String literals
    if (main[i] === '"' || main[i] === "'") {
      const q = main[i]
      let j = i + 1
      while (j < main.length && main[j] !== q) {
        if (main[j] === '\\') j++
        j++
      }
      j++ // closing quote
      out.push(`<span style="color:#ce9178">${esc(main.slice(i, j))}</span>`)
      i = j
      continue
    }

    // Numbers
    if (/\d/.test(main[i]) && (i === 0 || /\W/.test(main[i - 1]))) {
      let j = i
      while (j < main.length && /[\d.]/.test(main[j])) j++
      out.push(`<span style="color:#b5cea8">${esc(main.slice(i, j))}</span>`)
      i = j
      continue
    }

    // Words (identifiers / keywords)
    if (/[a-zA-Z_]/.test(main[i])) {
      let j = i
      while (j < main.length && /\w/.test(main[j])) j++
      const word = main.slice(i, j)

      if (KEYWORDS.has(word)) {
        out.push(`<span style="color:#569cd6">${esc(word)}</span>`)
      } else if (word === 'nn' || word === 'torch' || word === 'transforms' || word === 'datasets') {
        out.push(`<span style="color:#4ec9b0">${esc(word)}</span>`)
      } else if (i > 0 && main[i - 1] === '.') {
        // method / attribute call
        out.push(`<span style="color:#9cdcfe">${esc(word)}</span>`)
      } else {
        // Check if next non-space char is '(' → function/class name
        let k = j
        while (k < main.length && main[k] === ' ') k++
        if (main[k] === '(') {
          out.push(`<span style="color:#dcdcaa">${esc(word)}</span>`)
        } else {
          out.push(esc(word))
        }
      }
      i = j
      continue
    }

    out.push(esc(main[i]))
    i++
  }

  return out.join('') + commentSuffix
}
