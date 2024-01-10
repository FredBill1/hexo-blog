---
title: 带权并查集
date: 2024-01-10 16:12:31
tags:
  - 算法
  - 数据结构
  - 并查集
  - 带权并查集
categories:
  - [算法, 数据结构]
---

# 带权并查集

## 1. 模板

{% contentbox "cpp &lt;weighted_dsu&gt;" type:code %}

```cpp
#include <bits/stdc++.h>

template <class T = int>
class weighted_dsu {
    int _n;
    T _mod;
    struct node {
        int parent_or_size;
        T weight;
    };
    std::vector<node> _nodes;
    T safe_mod(T x) const {
        if (_mod == T{}) return x;
        x %= _mod;
        if (x < 0) x += _mod;
        return x;
    }

   public:
    weighted_dsu() : weighted_dsu(0) {}
    explicit weighted_dsu(int n, T mod = T{}) : _n(n), _mod(mod), _nodes(n, {-1, T{}}) {}
    weighted_dsu(const weighted_dsu&) = default;
    weighted_dsu(weighted_dsu&&) = default;
    weighted_dsu& operator=(const weighted_dsu&) = default;
    weighted_dsu& operator=(weighted_dsu&&) = default;
    int leader(int a) {
        assert(0 <= a && a < _n);
        std::stack<int> stk;
        int root = a;
        while (_nodes[root].parent_or_size >= 0) {
            stk.push(root);
            root = _nodes[root].parent_or_size;
        }
        for (int parent = root; !stk.empty(); stk.pop()) {
            int cur = stk.top();
            _nodes[cur].parent_or_size = root;
            _nodes[cur].weight = safe_mod(_nodes[cur].weight + _nodes[parent].weight);
            parent = cur;
        }
        return root;
    }
    int size(int a) {
        assert(0 <= a && a < _n);
        return -_nodes[leader(a)].parent_or_size;
    }
    T weight(int a) {
        assert(0 <= a && a < _n);
        leader(a);
        return _nodes[a].weight;
    }
    // return (a - b) % _mod
    // return std::nullopt if the relation is not determined
    std::optional<T> relation(int a, int b) {
        assert(0 <= a && a < _n);
        assert(0 <= b && b < _n);
        int leader_a = leader(a), leader_b = leader(b);
        if (leader_a != leader_b) return std::nullopt;
        return safe_mod(_nodes[a].weight - _nodes[b].weight);
    }
    // insert `a - b = c (mod _mod)` to the relations
    // return false if conflict
    bool merge(int a, int b, T c) {
        assert(0 <= a && a < _n);
        assert(0 <= b && b < _n);
        c = safe_mod(c);
        int leader_a = leader(a), leader_b = leader(b);
        if (leader_a == leader_b) return safe_mod(_nodes[a].weight - _nodes[b].weight) == c;
        if (-_nodes[leader_a].parent_or_size < -_nodes[leader_b].parent_or_size) {
            std::swap(leader_a, leader_b);
            std::swap(a, b);
            c = safe_mod(-c);
        }
        _nodes[leader_a].parent_or_size += _nodes[leader_b].parent_or_size;
        _nodes[leader_b].parent_or_size = leader_a;
        _nodes[leader_b].weight = safe_mod(safe_mod(_nodes[a].weight - _nodes[b].weight) - c);
        return true;
    }
};
```

{% endcontentbox %}

## 2. 例题

### 2.1. [洛谷P2024](https://www.luogu.com.cn/problem/P2024) 模3意义下的加法群

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <weighted_dsu>
using namespace std;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, K;
    cin >> N >> K;
    weighted_dsu dsu(N + 1, 3);
    int res = 0;
    while (K--) {
        int op, x, y;
        cin >> op >> x >> y;
        if (x > N || y > N) {
            ++res;
            continue;
        }
        if (op == 1) {
            res += !dsu.merge(x, y, 0);
        } else {
            res += !dsu.merge(x, y, 1);
        }
    }
    cout << res;
}
```

{% endcontentbox %}

### 2.2 [洛谷P2661](https://www.luogu.com.cn/problem/P2661) 所有节点入度均为1的有向图中找最小环的大小

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <weighted_dsu>
using namespace std;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, f;
    cin >> N;
    weighted_dsu<int> dsu(N + 1);
    int res = numeric_limits<int>::max();
    for (int i = 1; i <= N; ++i) {
        cin >> f;
        auto r = dsu.relation(i, f);
        if (r.has_value()) {
            res = min(res, 1 - *r);
        } else {
            dsu.merge(i, f, 1);
        }
    }
    cout << res;
}
```

{% endcontentbox %}
