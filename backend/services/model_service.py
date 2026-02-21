import torch
from torch import nn
from torch.utils.data import DataLoader, random_split
import math
from torch.utils.data import Subset
from torchvision import datasets, transforms
from pathlib import Path

from utils.validation import DEFAULT_HYPERPARAMS, IMAGE_FLATTENED_SIZE


SERVICES_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SERVICES_DIR.parent
MNIST_DATA_ROOT = SERVICES_DIR / "data" / "mnist"
EMNIST_DATA_ROOT = BACKEND_DIR / "data" / "mnist"  # EMNIST is stored under backend/data/mnist/EMNIST/


class ResidualBlock(nn.Module):
    """Conv → BN → ReLU → Conv → BN + skip connection → ReLU"""
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


def build_model(architecture):
    layers = []
    for layer_spec in architecture["layers"]:
        layer_type = str(layer_spec["type"]).lower()
        if layer_type == "linear":
            layers.append(nn.Linear(layer_spec["in"], layer_spec["out"]))
        elif layer_type == "conv2d":
            padding = layer_spec.get("padding", 0)
            layers.append(
                nn.Conv2d(
                    layer_spec["in_channels"],
                    layer_spec["out_channels"],
                    kernel_size=layer_spec["kernel_size"],
                    stride=layer_spec.get("stride", 1),
                    padding=padding,
                )
            )
        elif layer_type == "maxpool2d":
            kernel_size = layer_spec.get("kernel_size", 2)
            stride = layer_spec.get("stride", kernel_size)
            padding = layer_spec.get("padding", 0)
            layers.append(
                nn.MaxPool2d(
                    kernel_size=kernel_size,
                    stride=stride,
                    padding=padding,
                )
            )
        elif layer_type == "dropout":
            p = float(layer_spec.get("p", layer_spec.get("rate", 0.5)))
            layers.append(nn.Dropout(p=p))
        elif layer_type == "batchnorm2d":
            num_features = int(layer_spec.get("num_features", 1))
            layers.append(nn.BatchNorm2d(num_features))
        elif layer_type == "batchnorm1d":
            num_features = int(layer_spec.get("num_features", 1))
            layers.append(nn.BatchNorm1d(num_features))
        elif layer_type == "flatten":
            layers.append(nn.Flatten())
        elif layer_type == "relu":
            layers.append(nn.ReLU())
        elif layer_type == "sigmoid":
            layers.append(nn.Sigmoid())
        elif layer_type == "tanh":
            layers.append(nn.Tanh())
        elif layer_type == "softmax":
            layers.append(nn.Softmax(dim=1))
        elif layer_type == "residual_block":
            in_ch = int(layer_spec.get("in_channels", 1))
            out_ch = int(layer_spec.get("out_channels", 64))
            ks = int(layer_spec.get("kernel_size", 3))
            layers.append(ResidualBlock(in_ch, out_ch, kernel_size=ks))
        else:
            raise ValueError(f"Unsupported layer type `{layer_type}`.")
    return nn.Sequential(*layers)


class EMNISTLettersDataset:
    """Wrapper for EMNIST letters dataset to remap labels from 1-26 to 0-25 and fix orientation"""
    def __init__(self, train=True, download=True, transform=None):
        self.dataset = datasets.EMNIST(
            root=str(EMNIST_DATA_ROOT),
            split='letters',  # Contains only letters A-Z (labels 1-26)
            train=train,
            download=download,
            transform=transform,
        )

    def __len__(self):
        return len(self.dataset)

    def __getitem__(self, idx):
        image, label = self.dataset[idx]
        # EMNIST images are rotated/transposed - fix orientation to match how users draw
        # Transpose: swap rows and columns (rotate 90° counterclockwise then flip horizontally)
        image = torch.transpose(image, 1, 2)
        # Remap EMNIST labels from 1-26 to 0-25 to work with cross-entropy loss
        adjusted_label = label - 1
        return image, adjusted_label


def _load_mnist_dataset(train: bool):
    transform = transforms.Compose([transforms.ToTensor()])
    try:
        dataset = datasets.MNIST(
            root=str(MNIST_DATA_ROOT),
            train=train,
            download=True,
            transform=transform,
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to load MNIST dataset: {exc}") from exc
    return dataset


def _load_emnist_dataset(train: bool):
    transform = transforms.Compose([transforms.ToTensor()])
    try:
        dataset = EMNISTLettersDataset(
            train=train,
            download=True,
            transform=transform,
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to load EMNIST dataset: {exc}") from exc
    return dataset


def prepare_dataloaders(batch_size, train_split, shuffle, max_samples, seed, dataset_type="emnist"):
    generator = torch.Generator()
    if seed is not None:
        generator.manual_seed(seed)

    if dataset_type.lower() == "mnist":
        dataset = _load_mnist_dataset(train=True)
    else:  # Default to EMNIST
        dataset = _load_emnist_dataset(train=True)
        
    dataset_size = len(dataset)

    desired_samples = max_samples or dataset_size
    desired_samples = max(desired_samples, batch_size * 2)
    desired_samples = min(desired_samples, dataset_size)
    desired_samples = max(2, desired_samples)

    if desired_samples < dataset_size:
        indices = torch.randperm(dataset_size, generator=generator)[:desired_samples]
        dataset = Subset(dataset, indices.tolist())

    train_len = max(1, int(len(dataset) * train_split))
    if train_len >= len(dataset):
        train_len = len(dataset) - 1
    val_len = max(1, len(dataset) - train_len)

    train_dataset, val_dataset = random_split(
        dataset, [train_len, val_len], generator=generator
    )

    train_loader = DataLoader(
        train_dataset, batch_size=batch_size, shuffle=shuffle, generator=generator
    )
    val_loader = DataLoader(
        val_dataset, batch_size=batch_size, shuffle=False, generator=generator
    )
    return train_loader, val_loader


def configure_optimizer(optimizer_cfg, parameters):
    opt_type = str(
        optimizer_cfg.get("type", DEFAULT_HYPERPARAMS["optimizer"]["type"])
    ).lower()
    lr = float(optimizer_cfg.get("lr", DEFAULT_HYPERPARAMS["optimizer"]["lr"]))
    if opt_type == "sgd":
        momentum = float(
            optimizer_cfg.get(
                "momentum", DEFAULT_HYPERPARAMS["optimizer"].get("momentum", 0.0)
            )
        )
        return torch.optim.SGD(parameters, lr=lr, momentum=momentum)
    if opt_type == "adam":
        beta1 = float(optimizer_cfg.get("beta1", 0.9))
        beta2 = float(optimizer_cfg.get("beta2", 0.999))
        eps = float(optimizer_cfg.get("eps", 1e-8))
        return torch.optim.Adam(parameters, lr=lr, betas=(beta1, beta2), eps=eps)
    raise ValueError(f"Unsupported optimizer `{opt_type}`.")


def tensor_from_pixels(pixels):
    if not isinstance(pixels, (list, tuple)):
        raise ValueError("`pixels` must be a list of numbers.")
    if len(pixels) != IMAGE_FLATTENED_SIZE:
        raise ValueError(f"`pixels` must contain exactly {IMAGE_FLATTENED_SIZE} values.")
    try:
        flattened = [float(value) for value in pixels]
    except (TypeError, ValueError) as exc:
        raise ValueError("`pixels` must be numeric.") from exc
    side = int(round(math.sqrt(IMAGE_FLATTENED_SIZE)))
    if side * side != IMAGE_FLATTENED_SIZE:
        raise ValueError("Input size does not correspond to a square image.")
    tensor = torch.tensor(flattened, dtype=torch.float32).view(1, 1, side, side)
    return tensor
