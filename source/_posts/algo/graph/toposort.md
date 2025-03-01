---
title: 拓扑排序
date: 2023-12-25 16:51:56
tags:
  - 算法
  - 图论
  - 拓扑排序
  - Kahn
categories:
  - [算法, 图论]
---

# 拓扑排序

## [洛谷B3644 【模板】拓扑排序 / 家谱树](https://www.luogu.com.cn/problem/B3644)

### Kahn算法

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

struct Edge {
    int v;
};
using AdjList = std::vector<std::vector<Edge>>;

std::vector<int> toposort(const AdjList& G) {
    const int N = G.size();
    std::vector<int> indeg(N);
    for (int u = 0; u < N; ++u)
        for (auto&& e : G[u]) ++indeg[e.v];
    std::vector<int> ord;
    ord.reserve(N);
    std::queue<int> q;
    for (int u = 0; u < N; ++u)
        if (!indeg[u]) q.push(u);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        ord.push_back(u);
        for (auto&& e : G[u])
            if (!--indeg[e.v]) q.push(e.v);
    }
    return ord;
}

using namespace std;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N;
    cin >> N;
    AdjList G(N);
    for (int u = 0, v; u < N; ++u)
        while (cin >> v, v) G[u].emplace_back(Edge{v - 1});
    auto topo = toposort(G);
    for (int u : topo) cout << u + 1 << ' ';
    return 0;
}
```

{% endcontentbox %}

### DFS

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

struct Edge {
    int v;
};
using AdjList = std::vector<std::vector<Edge>>;

std::vector<int> toposort(const AdjList& G) {
    const int N = G.size();
    std::vector<bool> vi(N);
    std::vector<int> topo(N);
    int i = N;
    auto dfs = [&](auto& dfs, int u) {
        if (vi[u]) return;
        vi[u] = true;
        for (auto& e : G[u]) dfs(dfs, e.v);
        topo[--i] = u;
    };
    for (int u = 0; u < N; ++u) dfs(dfs, u);
    return topo;
}

using namespace std;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N;
    cin >> N;
    AdjList G(N);
    for (int u = 0, v; u < N; ++u)
        while (cin >> v, v) G[u].emplace_back(Edge{v - 1});
    auto topo = toposort(G);
    for (int u : topo) cout << u + 1 << ' ';
    return 0;
}
```

{% endcontentbox %}
