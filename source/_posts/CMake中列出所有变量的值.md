---
title: CMake中列出所有变量的值
date: 2023-11-12 10:15:55
tags:
  - CMake
categories:
  - 编程
---

# CMake中列出所有变量的值

## 1. 在CMakelists.txt中打印所有变量

> 参考：<https://stackoverflow.com/a/9328525/19344463>

使用[get_cmake_property](https://cmake.org/cmake/help/latest/command/get_cmake_property.html)指令，用循环打印所有变量的值

```cmake
get_cmake_property(_variableNames VARIABLES)
list (SORT _variableNames)
foreach (_variableName ${_variableNames})
    message(STATUS "${_variableName}=${${_variableName}}")
endforeach()
```

也可以定义一个方便的函数，并用正则表达式来过滤出需要的变量

```cmake
function(dump_cmake_variables)
    get_cmake_property(_variableNames VARIABLES)
    list (SORT _variableNames)
    foreach (_variableName ${_variableNames})
        if (ARGV0)
            unset(MATCHED)
            string(REGEX MATCH ${ARGV0} MATCHED ${_variableName})
            if (NOT MATCHED)
                continue()
            endif()
        endif()
        message(STATUS "${_variableName}=${${_variableName}}")
    endforeach()
endfunction()
```

如果需要打印环境变量，则可以使用CMake的[命令行指令](https://cmake.org/cmake/help/latest/manual/cmake.1.html#command-line-tool-mode)

```cmake
execute_process(COMMAND "${CMAKE_COMMAND}" "-E" "environment")
```

> 参考：<https://stackoverflow.com/a/66876743/19344463>

如果需要打印某个路径下的所有变量，可以使用[get_property](https://cmake.org/cmake/help/latest/command/get_property.html)

```cmake
function(print_directory_variables dir)
    # Dump variables:
    get_property(_variableNames DIRECTORY ${dir} PROPERTY VARIABLES)
    list (SORT _variableNames)
    foreach (_variableName ${_variableNames})
        get_directory_property(_variableValue DIRECTORY ${dir} DEFINITION ${_variableName})
        message(STATUS "DIR ${dir}: ${_variableName}=${_variableValue}")
    endforeach()
endfunction(print_directory_variables)

# for example
print_directory_variables(.)
print_directory_variables(ui/qt)
```

## 2. 使用命令行打印缓存的变量

> 参考：<https://stackoverflow.com/a/18839117/19344463>

如果只需要打印缓存的变量(不包含未缓存的变量和特殊变量，如WIN32, UNIX, APPLE等)，可以进入build目录后使用以下命令

```bash
cmake -LAH
```
