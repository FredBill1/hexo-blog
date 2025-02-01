---
title: y_combinator in C++
date: 2024-01-11 20:41:39
tags:
  - C++
categories:
  - 编程
---

# y_combinator in C++

> 来源：<https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2016/p0200r0.html>

## 1. 模板

{% contentbox "cpp &lt;y_combinator&gt;" type:code %}

```cpp
#include <functional>
#include <utility>

template <class Fun>
class y_combinator_result {
    Fun fun_;

   public:
    template <class T>
    explicit y_combinator_result(T &&fun) : fun_(std::forward<T>(fun)) {}
    template <class... Args>
    decltype(auto) operator()(Args &&...args) {
        return fun_(std::ref(*this), std::forward<Args>(args)...);
    }
};
template <class Fun>
decltype(auto) y_combinator(Fun &&fun) {
    return y_combinator_result<std::decay_t<Fun>>(std::forward<Fun>(fun));
}
```

{% endcontentbox %}

## 2. 用法

{% contentbox "cpp" type:code %}

```cpp
int main() {
    std::vector<std::vector<int>> G;
    y_combinator([&](auto dfs, int u) -> void {
        for (auto v : G[u]) dfs(v);
    })(1);
}
```

{% endcontentbox %}
