---
title: 割点、桥，点、边双连通分量
date: 2023-12-24 23:30:47
tags:
  - 算法
  - 图论
  - 割点
  - 桥
  - 点/边双连通分量(DCC)
  - Tarjan
categories:
  - [算法, 图论, 连通性相关]
---

# 割点、桥，点、边双连通分量

> 参考：<https://oi-wiki.org/graph/cut>

## [洛谷P3388](https://www.luogu.com.cn/problem/P3388) 割点

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

struct Edge {
    int v;
};
using AdjList = std::vector<std::vector<Edge>>;

std::vector<bool> cut_point(const AdjList& G) {
    const int N = G.size();
    std::vector<int> dfn(N, -1), low(N);
    std::vector<bool> is_cut(N);
    int dfn_cnt = 0;

    auto dfs = [&](auto& dfs, int u, int pre) -> void {
        low[u] = dfn[u] = dfn_cnt++;
        int child_cnt = 0;
        for (auto&& e : G[u]) {
            if (e.v == pre) continue;
            if (dfn[e.v] != -1) {
                low[u] = std::min(low[u], dfn[e.v]);
                continue;
            }
            dfs(dfs, e.v, u);
            low[u] = std::min(low[u], low[e.v]);
            if (pre != -1 && low[e.v] >= dfn[u]) is_cut[u] = true;
            ++child_cnt;
        }
        if (pre == -1 && child_cnt >= 2) is_cut[u] = true;
    };

    for (int u = 0; u < N; ++u)
        if (dfn[u] == -1) dfs(dfs, u, -1);
    return is_cut;
}

using namespace std;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    AdjList G(N);
    for (int i = 0; i < M; ++i) {
        int u, v;
        cin >> u >> v;
        --u, --v;
        G[u].emplace_back(Edge{v});
        G[v].emplace_back(Edge{u});
    }
    auto is_cut = cut_point(G);
    cout << ranges::count(is_cut, true) << '\n';
    for (int u = 0; u < N; ++u)
        if (is_cut[u]) cout << u + 1 << ' ';
    return 0;
}
```

{% endcontentbox %}

## 桥 (见下面的[边双连通分量](#洛谷p8436-边双连通分量))

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

struct Edge {
    int v;
    bool is_bridge;
};
class AdjList {
    std::vector<std::vector<int>> G;
    std::vector<Edge> e;

   public:
    AdjList(int N, int M) : G(N) { e.reserve(M * 2); }
    int size() const { return G.size(); }
    const std::vector<int>& edge_ids(int u) const { return G[u]; }
    const Edge& operator[](int edge_id) const { return e[edge_id]; }
    Edge& operator[](int edge_id) { return e[edge_id]; }
    void add_edge(int u, int v) {
        G[u].push_back(e.size()), e.push_back(Edge{v, false});
        G[v].push_back(e.size()), e.push_back(Edge{u, false});
    }
};

void bridge(AdjList& G) {
    const int N = G.size();
    std::vector<int> dfn(N, -1), low(N);
    int dfn_cnt = 0;
    auto dfs = [&](auto& dfs, int u, int in_edge_id) -> void {
        low[u] = dfn[u] = dfn_cnt++;
        for (int edge_id : G.edge_ids(u)) {
            auto& e = G[edge_id];
            if (dfn[e.v] == -1) {
                dfs(dfs, e.v, edge_id);
                low[u] = std::min(low[u], low[e.v]);
                if (low[e.v] > dfn[u]) e.is_bridge = G[edge_id ^ 1].is_bridge = true;
            } else if ((edge_id ^ 1) != in_edge_id) {
                low[u] = std::min(low[u], dfn[e.v]);
            }
        }
    };
    for (int u = 0; u < N; ++u)
        if (dfn[u] == -1) dfs(dfs, u, -1);
}
```

{% endcontentbox %}

## [洛谷P8435](https://www.luogu.com.cn/problem/P8435) 点双连通分量

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

struct Edge {
    int v;
};
using AdjList = std::vector<std::vector<Edge>>;

std::vector<std::vector<int>> v_dcc(const AdjList& G) {
    const int N = G.size();
    std::vector<int> dfn(N, -1), low(N), stk;
    std::vector<std::vector<int>> dccs;
    stk.reserve(N);
    int dfn_cnt = 0;

    auto dfs = [&](auto& dfs, int u, int pre) -> void {
        low[u] = dfn[u] = dfn_cnt++;
        stk.push_back(u);
        bool has_unvisited_child = false;
        for (auto&& e : G[u]) {
            if (dfn[e.v] == -1) {
                has_unvisited_child = true;
                dfs(dfs, e.v, u);
                low[u] = std::min(low[u], low[e.v]);
                if (low[e.v] >= dfn[u]) {
                    auto& dcc = dccs.emplace_back();
                    for (;;) {
                        int v = stk.back();
                        stk.pop_back();
                        dcc.push_back(v);
                        if (v == e.v) break;
                    }
                    dcc.push_back(u);
                }
            } else if (e.v != pre) {
                low[u] = std::min(low[u], dfn[e.v]);
            }
        }
        if (pre == -1 && !has_unvisited_child) {
            dccs.emplace_back().emplace_back(u);
            return;
        }
    };
    for (int u = 0; u < N; ++u)
        if (dfn[u] == -1) dfs(dfs, u, -1);
    return dccs;
}

using namespace std;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    AdjList G(N);
    for (int i = 0; i < M; ++i) {
        int u, v;
        cin >> u >> v;
        --u, --v;
        G[u].emplace_back(Edge{v});
        G[v].emplace_back(Edge{u});
    }
    auto dccs = v_dcc(G);
    cout << dccs.size() << "\n";
    for (auto&& dcc : dccs) {
        cout << dcc.size();
        for (int v : dcc) cout << ' ' << v + 1;
        cout << "\n";
    }
    return 0;
}
```

{% endcontentbox %}

## [洛谷P8436](https://www.luogu.com.cn/problem/P8436) 边双连通分量

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

struct Edge {
    int v;
    bool is_bridge;
};
class AdjList {
    std::vector<std::vector<int>> G;
    std::vector<Edge> e;

   public:
    AdjList(int N, int M) : G(N) { e.reserve(M * 2); }
    int size() const { return G.size(); }
    const std::vector<int>& edge_ids(int u) const { return G[u]; }
    const Edge& operator[](int edge_id) const { return e[edge_id]; }
    Edge& operator[](int edge_id) { return e[edge_id]; }
    void add_edge(int u, int v) {
        G[u].push_back(e.size()), e.push_back(Edge{v, false});
        G[v].push_back(e.size()), e.push_back(Edge{u, false});
    }
};

void bridge(AdjList& G) {
    const int N = G.size();
    std::vector<int> dfn(N, -1), low(N);
    int dfn_cnt = 0;
    auto dfs = [&](auto& dfs, int u, int in_edge_id) -> void {
        low[u] = dfn[u] = dfn_cnt++;
        for (int edge_id : G.edge_ids(u)) {
            auto& e = G[edge_id];
            if (dfn[e.v] == -1) {
                dfs(dfs, e.v, edge_id);
                low[u] = std::min(low[u], low[e.v]);
                if (low[e.v] > dfn[u]) e.is_bridge = G[edge_id ^ 1].is_bridge = true;
            } else if ((edge_id ^ 1) != in_edge_id) {
                low[u] = std::min(low[u], dfn[e.v]);
            }
        }
    };
    for (int u = 0; u < N; ++u)
        if (dfn[u] == -1) dfs(dfs, u, -1);
}

std::vector<std::vector<int>> e_dcc(const AdjList& G) {
    const int N = G.size();
    std::vector<bool> vi(N);
    std::vector<std::vector<int>> dccs;
    auto dfs = [&](auto& dfs, int u) -> void {
        vi[u] = true;
        dccs.back().push_back(u);
        for (int edge_id : G.edge_ids(u)) {
            auto&& e = G[edge_id];
            if (!(e.is_bridge || vi[e.v])) dfs(dfs, e.v);
        }
    };
    for (int u = 0; u < N; ++u) {
        if (vi[u]) continue;
        dccs.emplace_back();
        dfs(dfs, u);
    }
    return dccs;
}

using namespace std;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    AdjList G(N, M);
    for (int i = 0; i < M; ++i) {
        int u, v;
        cin >> u >> v;
        --u, --v;
        G.add_edge(u, v);
    }
    bridge(G);
    auto dccs = e_dcc(G);
    cout << dccs.size() << '\n';
    for (auto&& dcc : dccs) {
        cout << dcc.size();
        for (int v : dcc) cout << ' ' << v + 1;
        cout << "\n";
    }
}
```

{% endcontentbox %}
