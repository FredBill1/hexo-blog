---
title: pytorch中使用共享内存缓存数据集，避免发生复制
date: 2023-11-11 20:33:09
tags:
  - python
  - pytorch
categories:
  - 编程
---

# pytorch中使用共享内存缓存数据集，避免发生复制

使用`multiprocessing.RawArray`存储数据，避免`Dataloader`在`num_workers > 0`时，所缓存的数据在进程间发生复制。

{% contentbox python type:code %}

```python
import ctypes
import multiprocessing as mp
from multiprocessing.pool import ThreadPool
from pathlib import Path

import cv2 as cv
import numpy as np
import torch
import torchvision.transforms.functional as F
from torch.utils.data import Dataset
from tqdm import tqdm


class SharedDataset(Dataset):
    def __init__(self, images_dir: Path, H: int, W: int) -> None:
        image_pathes = list(map(lambda x: x.suffix in [".jpg", ".png"], images_dir.iterdir()))
        self._H, self._W = H, W
        self._num_images = len(image_pathes)
        self._shared_array = mp.RawArray(ctypes.c_ubyte, self._num_images * H * W * 3)
        images = self._images()

        def load_image(i_path: tuple[int, Path]) -> None:
            i, path = i_path
            image: np.ndarray = cv.imread(str(path), cv.IMREAD_COLOR)
            if image.shape[:2] != (H, W):
                image = cv.resize(image, (W, H), interpolation=cv.INTER_CUBIC)
            images[i] = image

        with ThreadPool() as pool:
            for _ in tqdm(pool.imap_unordered(load_image, enumerate(image_pathes)), desc="loading images", total=self._num_images):
                pass

    def _images(self) -> np.ndarray:
        return np.ctypeslib.as_array(self._shared_array).reshape(self._num_images, self._H, self._W, 3)

    def __len__(self) -> int:
        return self._num_images

    def __getitem__(self, index: int) -> torch.Tensor:
        return F.to_tensor(self._images()[index])
```

{% endcontentbox %}
