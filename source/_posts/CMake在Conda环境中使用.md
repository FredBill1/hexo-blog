---
title: CMake在Conda环境中使用
date: 2023-11-11 16:30:49
tags:
  - CMake
  - Conda
categories:
  - 编程
---

# CMake在Conda环境中使用

```bash
export CMAKE_PREFIX_PATH=$CONDA_PREFIX
```

或

```bash
cmake -DCMAKE_PREFIX_PATH=$CONDA_PREFIX
```

例如：

```bash
cmake -DCMAKE_PREFIX_PATH=/home/fredbill/miniconda3/envs/myvenv
```
