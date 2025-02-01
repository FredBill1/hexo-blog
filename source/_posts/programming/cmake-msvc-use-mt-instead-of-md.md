---
title: 在CMake中让MSVC使用MT(静态链接)而非MD(动态链接)运行库
date: 2023-11-11 16:55:31
tags:
  - CMake
categories:
  - 编程
---

# 在CMake中让MSVC使用MT(静态链接)而非MD(动态链接)运行库

> 参考：<https://cmake.org/cmake/help/latest/prop_tgt/MSVC_RUNTIME_LIBRARY.html>

```cmake
set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
# or
set_property(TARGET <目标> PROPERTY MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} /NODEFAULTLIB:LIBCMTD.lib")
```
