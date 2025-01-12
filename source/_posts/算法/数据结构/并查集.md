---
title: 并查集
date: 2023-12-03 17:08:39
tags:
  - 算法
  - 数据结构
  - 并查集
categories:
  - [算法, 数据结构]
---

# 并查集

> 参考：<https://github.com/atcoder/ac-library>

## 1. 模板

模板的接口文档在[这里](https://atcoder.github.io/ac-library/production/document_en/dsu.html)。其中的`leader`方法改成了非递归写法，防止爆栈。可持久化并查集见 {% post_link 可持久化线段树 '可持久化线段树的模板' %} 。

{% contentbox "cpp &lt;atcoder/dsu&gt;" type:code %}

```cpp
#include <algorithm>
#include <cassert>
#include <vector>

namespace atcoder {

struct dsu {
   public:
    dsu() : _n(0) {}
    explicit dsu(int n) : _n(n), parent_or_size(n, -1) {}
    dsu(const dsu&) = default;
    dsu(dsu&&) = default;
    dsu& operator=(const dsu&) = default;
    dsu& operator=(dsu&&) = default;

    int merge(int a, int b) {
        assert(0 <= a && a < _n);
        assert(0 <= b && b < _n);
        int x = leader(a), y = leader(b);
        if (x == y) return x;
        if (-parent_or_size[x] < -parent_or_size[y]) std::swap(x, y);
        parent_or_size[x] += parent_or_size[y];
        parent_or_size[y] = x;
        return x;
    }

    bool same(int a, int b) {
        assert(0 <= a && a < _n);
        assert(0 <= b && b < _n);
        return leader(a) == leader(b);
    }

    int leader(int a) {
        assert(0 <= a && a < _n);
        int t = a;
        while (parent_or_size[t] >= 0) t = parent_or_size[t];
        while (a != t) {
            int u = parent_or_size[a];
            parent_or_size[a] = t;
            a = u;
        }
        return t;
    }

    int size(int a) {
        assert(0 <= a && a < _n);
        return -parent_or_size[leader(a)];
    }

    std::vector<std::vector<int>> groups() {
        std::vector<int> leader_buf(_n), group_size(_n);
        for (int i = 0; i < _n; i++) {
            leader_buf[i] = leader(i);
            group_size[leader_buf[i]]++;
        }
        std::vector<std::vector<int>> result(_n);
        for (int i = 0; i < _n; i++) {
            result[i].reserve(group_size[i]);
        }
        for (int i = 0; i < _n; i++) {
            result[leader_buf[i]].push_back(i);
        }
        result.erase(std::remove_if(result.begin(), result.end(), [&](const std::vector<int>& v) { return v.empty(); }),
                     result.end());
        return result;
    }

   private:
    int _n;
    std::vector<int> parent_or_size;
};

}  // namespace atcoder
```

{% endcontentbox %}

{% contentbox "python" type:code %}

```python
class DSU:
    def __init__(self, N: int) -> None:
        self.N = N
        self.parent_or_size = [-1] * N

    def leader(self, a: int) -> int:
        t = a
        while self.parent_or_size[t] >= 0:
            t = self.parent_or_size[t]
        while a != t:
            u = self.parent_or_size[a]
            self.parent_or_size[a] = t
            a = u
        return t

    def merge(self, a: int, b: int) -> int:
        x, y = self.leader(a), self.leader(b)
        if x == y:
            return x
        if -self.parent_or_size[x] < -self.parent_or_size[y]:
            x, y = y, x
        self.parent_or_size[x] += self.parent_or_size[y]
        self.parent_or_size[y] = x
        return x

    def same(self, a: int, b: int):
        return self.leader(a) == self.leader(b)
```

{% endcontentbox %}

## 2. 例题

### 2.1. [洛谷P3367](https://www.luogu.com.cn/problem/P3367) 并查集

> - `1 x y`: 合并`x`和`y`所在的集合
> - `2 x y`: 判断`x`和`y`是否在同一个集合中

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

#include <atcoder/dsu>

using namespace std;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    atcoder::dsu uf(N + 1);
    while (M--) {
        int op, x, y;
        cin >> op >> x >> y;
        if (op == 1) {
            uf.merge(x, y);
        } else {
            cout << (uf.same(x, y) ? "Y\n" : "N\n");
        }
    }
}
```

{% endcontentbox %}
