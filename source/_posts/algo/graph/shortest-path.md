---
title: 最短路
date: 2023-12-24 18:43:34
tags:
  - 算法
  - 图论
  - 最短路
  - Floyd
  - Bellman-Ford
  - Dijsktra
  - Johnson
categories:
  - [算法, 图论]
---

# 最短路

> 参考：<https://oi-wiki.org/graph/shortest-path>

|   最短路算法   |        Floyd         | Bellman–Ford |   Dijkstra   |       Johnson        |
| :------------: | :------------------: | :----------: | :----------: | :------------------: |
|   最短路类型   | 每对结点之间的最短路 |  单源最短路  |  单源最短路  | 每对结点之间的最短路 |
|     作用于     |        任意图        |    任意图    |   非负权图   |        任意图        |
| 能否检测负环？ |          能          |      能      |     不能     |          能          |
|   时间复杂度   |       $O(V^3)$       |   $O(VE)$    | $O(E\log E)$ |    $O(VE\log E)$     |

## Floyd [洛谷B3647](https://www.luogu.com.cn/problem/B3647) 全源最短路

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

using dist_t = int;
struct AdjMatrix {
    int N;
    std::vector<dist_t> adj;
    static constexpr dist_t inf = std::numeric_limits<dist_t>::max() / 2;
    AdjMatrix(int N) : N(N), adj(N * N, inf) {
        for (int i = 0; i < N; ++i) adj[i * N + i] = 0;
    }
    dist_t& operator()(int u, int v) { return adj[u * N + v]; }
};
void floyd(AdjMatrix& adj) {
    for (int k = 0; k < adj.N; ++k)
        for (int i = 0; i < adj.N; ++i)
            for (int j = 0; j < adj.N; ++j)
                if (dist_t d = adj(i, k) + adj(k, j); d < adj(i, j)) adj(i, j) = d;
}

using namespace std;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    AdjMatrix adj(N);
    for (int i = 0; i < M; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        --u, --v;
        adj(u, v) = adj(v, u) = w;
    }
    floyd(adj);
    for (int i = 0; i < N; ++i) {
        for (int j = 0; j < N; ++j) cout << adj(i, j) << ' ';
        cout << '\n';
    }
    return 0;
}
```

{% endcontentbox %}

或者跑 $N$ 次 Dijkstra

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

using dist_t = int;
struct Edge {
    int v;
    dist_t w;
};
using AdjList = std::vector<std::vector<Edge>>;

std::vector<dist_t> dijkstra(const AdjList& G, int s) {
    std::vector<dist_t> dist(G.size(), std::numeric_limits<dist_t>::max() / 2);
    dist[s] = 0;
    using item = std::pair<dist_t, int>;
    std::priority_queue<item, std::vector<item>, std::greater<item>> pq;
    pq.emplace(0, s);
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto&& [v, w] : G[u])
            if (dist_t dv = dist[u] + w; dv < dist[v]) pq.emplace(dist[v] = dv, v);
    }
    return dist;
}

using namespace std;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    AdjList G(N);
    for (int i = 0; i < M; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        --u, --v;
        G[u].emplace_back(Edge{v, w});
        G[v].emplace_back(Edge{u, w});
    }
    for (int S = 0; S < N; ++S) {
        auto dist = dijkstra(G, S);
        for (auto&& x : dist) cout << x << ' ';
        cout << '\n';
    }
    return 0;
}
```

{% endcontentbox %}

## Bellman–Ford [洛谷P3385](https://www.luogu.com.cn/problem/P3385) 判断负环

$T$ 组数据，判断是否存在**从顶点 $1$ 出发能到达的负环**。

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

using dist_t = int;
struct Edge {
    int v;
    dist_t w;
};
using AdjList = std::vector<std::vector<Edge>>;

std::optional<std::vector<dist_t>> bellmanford(const AdjList& G, int s) {
    constexpr dist_t inf = std::numeric_limits<dist_t>::max() / 2;
    std::vector<dist_t> dist(G.size(), inf);
    std::vector<int> cnt(G.size());
    std::vector<bool> vi(G.size());
    dist[s] = 0, vi[s] = true;
    std::queue<int> q({s});
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        vi[u] = false;
        for (auto&& [v, w] : G[u])
            if (dist_t dv = dist[u] + w; dv < dist[v]) {
                dist[v] = dv;
                if ((cnt[v] = cnt[u] + 1) >= G.size()) return std::nullopt;
                if (!vi[v]) q.emplace(v), vi[v] = true;
            }
    }
    return dist;
}

using namespace std;

bool solve() {
    int N, M;
    cin >> N >> M;
    AdjList G(N);
    for (int i = 0; i < M; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        --u, --v;
        G[u].emplace_back(Edge{v, w});
        if (w >= 0) G[v].emplace_back(Edge{u, w});
    }
    return !bellmanford(G, 0).has_value();
}

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int T;
    cin >> T;
    while (T--) puts(solve() ? "YES" : "NO");
}
```

{% endcontentbox %}

## Dijkstra [洛谷P4779](https://www.luogu.com.cn/problem/P4779) 单源最短路

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

using dist_t = int;
struct Edge {
    int v;
    dist_t w;
};
using AdjList = std::vector<std::vector<Edge>>;

std::vector<dist_t> dijkstra(const AdjList& G, int s) {
    std::vector<dist_t> dist(G.size(), std::numeric_limits<dist_t>::max() / 2);
    dist[s] = 0;
    using item = std::pair<dist_t, int>;
    std::priority_queue<item, std::vector<item>, std::greater<item>> pq;
    pq.emplace(0, s);
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto&& [v, w] : G[u])
            if (dist_t dv = dist[u] + w; dv < dist[v]) pq.emplace(dist[v] = dv, v);
    }
    return dist;
}

using namespace std;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M, S;
    cin >> N >> M >> S;
    --S;
    AdjList G(N);
    for (int i = 0; i < M; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        --u, --v;
        G[u].emplace_back(Edge{v, w});
    }
    auto dist = dijkstra(G, S);
    for (auto&& x : dist) cout << x << ' ';
    return 0;
}
```

{% endcontentbox %}

## Johnson [洛谷P5905](https://www.luogu.com.cn/problem/P5905) 有负环的全源最短路，卡Floyd

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

using dist_t = int;
struct Edge {
    int v;
    dist_t w;
};
using AdjList = std::vector<std::vector<Edge>>;
using AdjMatrix = std::vector<std::vector<dist_t>>;

std::optional<std::vector<dist_t>> bellmanford(const AdjList& G, int s) {
    constexpr dist_t inf = std::numeric_limits<dist_t>::max() / 2;
    std::vector<dist_t> dist(G.size(), inf);
    std::vector<int> cnt(G.size());
    std::vector<bool> vi(G.size());
    dist[s] = 0, vi[s] = true;
    std::queue<int> q({s});
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        vi[u] = false;
        for (auto&& [v, w] : G[u])
            if (dist_t dv = dist[u] + w; dv < dist[v]) {
                dist[v] = dv;
                if ((cnt[v] = cnt[u] + 1) >= G.size()) return std::nullopt;
                if (!vi[v]) q.emplace(v), vi[v] = true;
            }
    }
    return dist;
}

std::vector<dist_t> dijkstra(const AdjList& G, int s) {
    std::vector<dist_t> dist(G.size(), std::numeric_limits<dist_t>::max() / 2);
    dist[s] = 0;
    using item = std::pair<dist_t, int>;
    std::priority_queue<item, std::vector<item>, std::greater<item>> pq;
    pq.emplace(0, s);
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto&& [v, w] : G[u])
            if (dist_t dv = dist[u] + w; dv < dist[v]) pq.emplace(dist[v] = dv, v);
    }
    return dist;
}

std::optional<AdjMatrix> johnson(AdjList&& G) {
    const int N = G.size();
    auto& new_node = G.emplace_back();
    new_node.reserve(N);
    for (int i = 0; i < N; ++i) new_node.emplace_back(Edge{i, 0});
    auto h_ = bellmanford(G, N);
    if (!h_.has_value()) return std::nullopt;

    auto& h = *h_;
    for (int u = 0; u <= N; ++u)
        for (auto& [v, w] : G[u]) w += h[u] - h[v];
    AdjMatrix dist;
    dist.reserve(N);
    for (int u = 0; u < N; ++u) {
        auto& row = dist.emplace_back(dijkstra(G, u));
        row.pop_back();
        for (int v = 0; v < N; ++v) row[v] += h[v] - h[u];
    }
    return dist;
}

using namespace std;
using ll = long long;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    AdjList G(N);
    for (int i = 0; i < M; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        --u, --v;
        G[u].emplace_back(Edge{v, w});
    }
    auto adj = johnson(std::move(G));
    if (!adj.has_value()) {
        cout << "-1";
        return 0;
    }
    for (auto&& row : *adj) {
        ll res = 0;
        for (int v = 0; v < N; ++v) res += ll(v + 1) * min(row[v], dist_t(1e9));
        cout << res << '\n';
    }
}
```

{% endcontentbox %}
