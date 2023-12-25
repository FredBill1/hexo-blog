---
title: LCA
date: 2023-11-29 22:30:57
tags:
  - 算法
  - 图论
  - LCA
  - 数据结构
  - ST表
categories:
  - [算法, 图论]
---

# LCA

## 1. 模板

### 1.1 用欧拉序列转化为-rmq-问题

> 参考：<https://oi-wiki.org/graph/lca/#用欧拉序列转化为-rmq-问题>

{% post_link ST表 'ST表的模板' %}

{% contentbox "cpp &lt;SparseTable&gt;" type:code %}

```cpp
#include <cassert>
#include <functional>
#include <vector>

#ifdef _MSC_VER
#include <intrin.h>
#endif

int countl_zero(unsigned int n) {
#ifdef _MSC_VER
    unsigned long index;
    _BitScanReverse(&index, n);
    return 31 - index;
#else
    return __builtin_clz(n);
#endif
}

template <typename T, class F = std::function<T(const T&, const T&)>>
class SparseTable {
    int n;
    std::vector<std::vector<T>> mat;
    F func;

   public:
    SparseTable() = default;
    SparseTable(const SparseTable&) = default;
    SparseTable(SparseTable&&) = default;
    SparseTable& operator=(const SparseTable&) = default;
    SparseTable& operator=(SparseTable&&) = default;
    template <typename U>
    SparseTable(U&& a, const F& f) : func(f) {
        n = static_cast<int>(a.size());
        int max_log = 32 - countl_zero(n);
        mat.resize(max_log);
        mat[0] = std::forward<U>(a);
        for (int j = 1; j < max_log; j++) {
            mat[j].resize(n - (1 << j) + 1);
            for (int i = 0; i <= n - (1 << j); i++) mat[j][i] = func(mat[j - 1][i], mat[j - 1][i + (1 << (j - 1))]);
        }
    }

    T get(int from, int to) const {  // [from, to)
        assert(0 <= from && from < to && to <= n);
        int lg = 31 - countl_zero(to - from);
        return func(mat[lg][from], mat[lg][to - (1 << lg)]);
    }
};
```

{% endcontentbox %}

{% contentbox "cpp &lt;LCA&gt;" type:code %}

```cpp
#include <algorithm>
#include <stack>

#include <SparseTable>

class LCA {
    std::vector<int> dfn, nfd;
    SparseTable<int> st;

   public:
    LCA() = default;
    LCA(const LCA&) = default;
    LCA(LCA&&) = default;
    LCA& operator=(const LCA&) = default;
    LCA& operator=(LCA&&) = default;
    LCA(const std::vector<std::vector<int>>& G, int root) {
        int N = static_cast<int>(G.size());
        dfn.resize(N), nfd.resize(N);
        std::vector<int> parent(N, root);
        std::stack<int> S({root});
        for (int cnt = -1, u; !S.empty();) {
            u = S.top(), S.pop();
            if (cnt != -1) nfd[cnt] = parent[u];
            dfn[u] = ++cnt;
            for (int v : G[u]) {
                if (v == parent[u]) continue;
                parent[v] = u, S.push(v);
            }
        }
        std::vector<int> data(N);
        for (int i = 0; i < N; ++i) data[i] = dfn[nfd[i]];
        st = SparseTable<int>(std::move(data), [](int a, int b) { return std::min(a, b); });
    }
    int operator()(int a, int b) {
        if (a == b) return a;
        auto [l, r] = std::minmax(dfn[a], dfn[b]);
        return nfd[st.get(l, r)];
    }
};
```

{% endcontentbox %}

{% contentbox "python SparseTable.py" type:code %}

```python
from collections.abc import Callable
from typing import Generic, TypeVar

T = TypeVar("T")


class SparseTable(Generic[T]):
    def __init__(self, data: list[T], func: Callable[[T, T], T]) -> None:
        self.func = func
        self.st = st = [data]
        i, N = 1, len(st[0])
        while 2 * i <= N:
            pre = st[-1]
            st.append([func(pre[j], pre[j + i]) for j in range(N - 2 * i + 1)])
            i <<= 1

    def query(self, begin: int, end: int) -> T:  # [begin, end)
        assert 0 <= begin < end <= len(self.st[0])
        lg = (end - begin).bit_length() - 1
        return self.func(self.st[lg][begin], self.st[lg][end - (1 << lg)])
```

{% endcontentbox %}

{% contentbox "python LCA.py" type:code %}

```python
from collections import deque

from SparseTable import SparseTable

class LCA:
    def __init__(self, G: list[list[int]], root: int) -> None:
        N = len(G)
        self.dfn, self.nfd, parent = ([root] * N for _ in range(3))
        cnt = -1
        S = deque([root])
        while S:
            u = S.pop()
            self.nfd[cnt] = parent[u]
            self.dfn[u] = cnt = cnt + 1
            for v in G[u]:
                if v != parent[u]:
                    parent[v] = u
                    S.append(v)
        self.st = SparseTable([self.dfn[u] for u in self.nfd], min)

    def __call__(self, a: int, b: int) -> int:
        if a == b:
            return a
        a, b = self.dfn[a], self.dfn[b]
        return self.nfd[self.st.query(a, b) if a < b else self.st.query(b, a)]
```

{% endcontentbox %}

## 2. 例题

### 2.1 [洛谷P3379](https://www.luogu.com.cn/problem/P3379) LCA

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

#include <LCA>

using namespace std;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M, root;
    cin >> N >> M >> root;
    vector<vector<int>> G(N + 1);
    while (--N) {
        int u, v;
        cin >> u >> v;
        G[u].push_back(v);
        G[v].push_back(u);
    }
    LCA lca(G, root);
    while (M--) {
        int u, v;
        cin >> u >> v;
        cout << lca(u, v) << '\n';
    }
}
```

{% endcontentbox %}

{% contentbox "python" type:code %}

```python
from LCA import LCA

N, Q, S = map(int, input().split())
G = [[] for _ in range(N + 1)]
for _ in range(N - 1):
    u, v = map(int, input().split())
    G[u].append(v)
    G[v].append(u)

lca = LCA(G, S)
for _ in range(Q):
    a, b = map(int, input().split())
    print(lca(a, b))
```

{% endcontentbox %}
