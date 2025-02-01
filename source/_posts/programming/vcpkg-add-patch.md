---
title: 在vcpkg中添加patch的方法
date: 2023-11-11 17:13:40
tags:
  - CMake
  - vcpkg
categories:
  - 编程
---

# 在vcpkg中添加patch的方法

> 参考：<https://learn.microsoft.com/en-us/vcpkg/examples/patching>

## 1. 以editable模式安装要patch的库

```bash
vcpkg install libpng:x64-uwp --editable
```

## 2. 在`buildtrees`目录中找到要patch的库，并用`git`记录当前状态

```bash
cd ~/vcpkg/buildtrees/libpng/src/v1.6.37-c993153cdf
git init .
git add .
git commit -m "temp"
```

## 3. 修改源码

## 4. 生成patch

```bash
git diff --ignore-space-at-eol | out-file -enc ascii ../../../../ports/libpng/use-abort-on-all-platforms.patch
```

```cmake
# ports/libpng/portfile.cmake
...
vcpkg_extract_source_archive_ex(
  OUT_SOURCE_PATH SOURCE_PATH
  ARCHIVE ${ARCHIVE}
  PATCHES 
    "use-abort-on-all-platforms.patch"
)

vcpkg_cmake_configure(
...
```

## 5. 重新安装并验证

```bash
vcpkg remove libpng:x64-uwp
```

```bash
vcpkg install libpng:x64-uwp
```

## 6. 更新`vcpkg.json`中的`port-version`

```json
// ports/libpng/vcpkg.json
{
  "name": "libpng",
  "version": "1.6.37",
  "port-version": 1,
  "dependencies": [
    "zlib"
  ]
}
```