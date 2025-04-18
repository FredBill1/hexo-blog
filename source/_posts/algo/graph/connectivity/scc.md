---
title: 强连通分量
date: 2023-12-24 22:04:06
tags:
  - 算法
  - 图论
  - 强连通分量(SCC)
  - 缩点
  - Tarjan
  - 拓扑排序
  - Kahn
  - Kosaraju
categories:
  - [算法, 图论, 连通性相关]
---

# 强连通分量

> 参考：
> 
> - <https://oi-wiki.org/graph/scc>
> - <https://github.com/atcoder/ac-library>

## [洛谷B3609](https://www.luogu.com.cn/problem/B3609) 强连通分量

### Tarjan

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

struct Edge {
    int v;
};
using AdjList = std::vector<std::vector<Edge>>;

std::pair<int, std::vector<int>> scc(const AdjList& G) {
    const int N = G.size();
    std::vector<int> dfn(N, -1), low(N), scc_ids(N), stk;
    stk.reserve(N);
    int dfn_cnt = 0, scc_cnt = 0;
    auto dfs = [&](auto& dfs, int u) -> void {
        low[u] = dfn[u] = dfn_cnt++;
        stk.push_back(u);
        for (auto&& e : G[u]) {
            if (dfn[e.v] != -1) {
                low[u] = std::min(low[u], dfn[e.v]);
                continue;
            }
            dfs(dfs, e.v);
            low[u] = std::min(low[u], low[e.v]);
        }
        if (dfn[u] == low[u]) {
            for (;;) {
                int v = stk.back();
                stk.pop_back();
                dfn[v] = N;
                scc_ids[v] = scc_cnt;
                if (v == u) break;
            }
            ++scc_cnt;
        }
    };
    for (int u = 0; u < G.size(); ++u)
        if (dfn[u] == -1) dfs(dfs, u);
    return {scc_cnt, scc_ids};
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
    }
    auto [scc_cnt, scc_ids] = scc(G);
    cout << scc_cnt << "\n";
    vector<vector<int>> sccs(scc_cnt);
    for (int u = 0; u < N; ++u) sccs[scc_ids[u]].push_back(u);
    vector<bool> vi(scc_cnt);
    for (auto&& scc_id : scc_ids) {
        if (vi[scc_id]) continue;
        vi[scc_id] = true;
        for (int v : sccs[scc_id]) cout << v + 1 << ' ';
        cout << "\n";
    }
    return 0;
}
```

{% endcontentbox %}

### Kosaraju

{% contentbox "cpp" type:code %}

```cpp
std::pair<int, std::vector<int>> scc(const AdjList& G) {
    const int N = G.size();
    AdjList G_rev(N);
    for (int u = 0; u < N; ++u)
        for (auto&& e : G[u]) G_rev[e.v].push_back(Edge{u});

    std::vector<int> ord;
    ord.reserve(N);
    std::vector<bool> vi(N);
    auto dfs1 = [&](auto& dfs1, int u) -> void {
        vi[u] = true;
        for (auto&& e : G[u])
            if (!vi[e.v]) dfs1(dfs1, e.v);
        ord.push_back(u);
    };
    for (int u = 0; u < N; ++u)
        if (!vi[u]) dfs1(dfs1, u);

    std::vector<int> scc_ids(N, -1);
    int scc_cnt = 0;
    auto dfs2 = [&](auto& dfs2, int u) -> void {
        scc_ids[u] = scc_cnt;
        for (auto&& e : G_rev[u])
            if (scc_ids[e.v] == -1) dfs2(dfs2, e.v);
    };
    for (int i = N - 1; i >= 0; --i)
        if (scc_ids[ord[i]] == -1) dfs2(dfs2, ord[i]), ++scc_cnt;

    return {scc_cnt, std::move(scc_ids)};
}
```

{% endcontentbox %}

## 缩点 [洛谷P3387](https://www.luogu.com.cn/problem/P3387)

拓扑排序见 {% post_link 拓扑排序 '拓扑排序的模板' %}

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

struct Edge {
    int v;
};
using AdjList = std::vector<std::vector<Edge>>;

std::pair<int, std::vector<int>> scc(const AdjList& G) {
    const int N = G.size();
    std::vector<int> dfn(N, -1), low(N), scc_ids(N), stk;
    stk.reserve(N);
    int dfn_cnt = 0, scc_cnt = 0;
    auto dfs = [&](auto& dfs, int u) -> void {
        low[u] = dfn[u] = dfn_cnt++;
        stk.push_back(u);
        for (auto&& e : G[u]) {
            if (dfn[e.v] == -1) {
                dfs(dfs, e.v);
                low[u] = std::min(low[u], low[e.v]);
            } else {
                low[u] = std::min(low[u], dfn[e.v]);
            }
        }
        if (dfn[u] == low[u]) {
            for (;;) {
                int v = stk.back();
                stk.pop_back();
                dfn[v] = N;
                scc_ids[v] = scc_cnt;
                if (v == u) break;
            }
            ++scc_cnt;
        }
    };
    for (int u = 0; u < G.size(); ++u)
        if (dfn[u] == -1) dfs(dfs, u);
    return {scc_cnt, scc_ids};
}

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
    int N, M;
    cin >> N >> M;
    vector<int> a(N);
    for (auto& x : a) cin >> x;
    AdjList G(N);
    for (int i = 0; i < M; ++i) {
        int u, v;
        cin >> u >> v;
        --u, --v;
        G[u].emplace_back(Edge{v});
    }
    auto [scc_cnt, scc_ids] = scc(G);
    AdjList G2(scc_cnt);
    vector<int> a2(scc_cnt);
    for (int u = 0; u < N; ++u) {
        a2[scc_ids[u]] += a[u];
        for (auto&& e : G[u])
            if (scc_ids[u] != scc_ids[e.v]) G2[scc_ids[u]].emplace_back(Edge{scc_ids[e.v]});
    }
    auto topo = toposort(G2);
    for (auto&& u : views::reverse(topo)) {
        if (G2[u].empty()) continue;
        auto v = G2[u] | views::transform([&](auto&& e) { return a2[e.v]; });
        a2[u] += *ranges::max_element(v);
    }
    cout << *ranges::max_element(a2);
    return 0;
}
```

{% endcontentbox %}
