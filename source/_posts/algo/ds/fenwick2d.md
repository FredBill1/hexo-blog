---
title: 二维树状数组
date: 2023-12-26 12:09:40
tags:
  - 算法
  - 数据结构
  - 树状数组
  - 二维树状数组
categories:
  - [算法, 数据结构]
---

# 树状数组

> 参考：<https://oi-wiki.org/ds/fenwick>

## 1. 模板

{% contentbox "cpp &lt;fenwick_tree_2d&gt;" type:code %}

```cpp
#include <bits/stdc++.h>

template <class T, T (*e)(), T (*sum)(T, T), T (*diff)(T, T) = nullptr>
class fenwick_tree_2d {
   protected:
    int n_, m_;
    std::vector<T> data_;

   public:
    fenwick_tree_2d() : fenwick_tree_2d(0, 0) {}
    explicit fenwick_tree_2d(int n, int m) : n_(n), m_(m), data_(n * m, e()) {}
    fenwick_tree_2d(fenwick_tree_2d const&) = default;
    fenwick_tree_2d(fenwick_tree_2d&&) = default;
    fenwick_tree_2d& operator=(fenwick_tree_2d const&) = default;
    fenwick_tree_2d& operator=(fenwick_tree_2d&&) = default;

    void add(int i, int j, T x) {
        assert(0 <= i && i < n_ && 0 <= j && j < m_);
        ++i, ++j;
        for (int u = i; u <= n_; u += u & -u)
            for (int v = j; v <= m_; v += v & -v) data_[(u - 1) * m_ + v - 1] = sum(data_[(u - 1) * m_ + v - 1], x);
    }
    T prefix_sum(int i, int j) const {
        assert(-1 <= i && i < n_ && -1 <= j && j < m_);
        ++i, ++j;
        T s = e();
        for (int u = i; u > 0; u -= u & -u)
            for (int v = j; v > 0; v -= v & -v) s = sum(s, data_[(u - 1) * m_ + v - 1]);
        return s;
    }
    T sum_range(int il, int jl, int ir, int jr) const {
        assert(0 <= il && il <= ir && ir <= n_ && 0 <= jl && jl <= jr && jr <= m_);
        static_assert(diff != nullptr);
        --il, --jl, --ir, --jr;
        return sum(diff(diff(prefix_sum(ir, jr), prefix_sum(il, jr)), prefix_sum(ir, jl)), prefix_sum(il, jl));
    }
    std::pair<int, int> size() const { return {n_, m_}; }
};
template <class T>
struct _fenwick_sum_2d {
    static T e() { return 0; }
    static T sum(T a, T b) { return a + b; }
    static T diff(T a, T b) { return a - b; }
    using type = fenwick_tree_2d<T, e, sum, diff>;
};
template <class T>
using fenwick_sum_2d = typename _fenwick_sum_2d<T>::type;
```

{% endcontentbox %}

## 2. 例题

### 2.1 [LibreOJ #133](https://loj.ac/p/133) 单点加，查询子矩阵和

> - `1 i j k` 将 `(i,j)` 位置上的数加上 `k`
> - `2 il jl ir jr` 输出子矩阵 `(il,jl)-(ir,jr)` 内每个数的和

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <fenwick_tree_2d>
using namespace std;
using ll = long long;
using fenwick_2d = fenwick_sum_2d<ll>;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M, op, il, jl, ir, jr;
    ll x;
    cin >> N >> M;
    fenwick_2d fw(N, M);
    while (cin >> op) {
        if (op == 1) {
            cin >> il >> jl >> x;
            fw.add(il - 1, jl - 1, x);
        } else {
            cin >> il >> jl >> ir >> jr;
            cout << fw.sum_range(il - 1, jl - 1, ir, jr) << '\n';
        }
    }
}
```

{% endcontentbox %}

### 2.2 [LibreOJ #134](https://loj.ac/p/134) 子矩阵加，查询单点值

> - `1 il jl ir jr k` 将子矩阵 `(il,jl)-(ir,jr)` 内每个数加上 `k`
> - `2 i j` 输出 `(i,j)` 位置上的数

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <fenwick_tree_2d>
using namespace std;
using ll = long long;
using fenwick_2d = fenwick_sum_2d<ll>;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M, op, il, jl, ir, jr;
    ll x;
    cin >> N >> M;
    fenwick_2d fw(N, M);
    while (cin >> op) {
        if (op == 1) {
            cin >> il >> jl >> ir >> jr >> x;
            --il, --jl, --ir, --jr;
            fw.add(il, jl, x);
            if (ir + 1 < N) fw.add(ir + 1, jl, -x);
            if (jr + 1 < M) fw.add(il, jr + 1, -x);
            if (ir + 1 < N && jr + 1 < M) fw.add(ir + 1, jr + 1, x);
        } else {
            cin >> il >> jl;
            cout << fw.prefix_sum(il - 1, jl - 1) << '\n';
        }
    }
}
```

{% endcontentbox %}

### 2.3 [LibreOJ #134](https://loj.ac/p/134) 子矩阵加，查询子矩阵和

> - `1 il jl ir jr k` 将子矩阵 `(il,jl)-(ir,jr)` 内每个数加上 `k`
> - `2 il jl ir jr` 输出子矩阵 `(il,jl)-(ir,jr)` 内每个数的和

思路见<https://oi-wiki.org/ds/fenwick/#子矩阵加求子矩阵和>

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <fenwick_tree_2d>
template <class T>
class fenwick_range_sum {
    using fenwick_2d = fenwick_sum_2d<T>;
    fenwick_2d t, ti, tj, tij;
    void add_(int i, int j, T x) {
        t.add(i, j, x);
        ti.add(i, j, x * i);
        tj.add(i, j, x * j);
        tij.add(i, j, x * i * j);
    }
    T prefix_sum_(int i, int j) const {
        int u = i + 1, v = j + 1;
        return t.prefix_sum(i, j) * u * v - ti.prefix_sum(i, j) * v - tj.prefix_sum(i, j) * u + tij.prefix_sum(i, j);
    }

   public:
    fenwick_range_sum() : fenwick_range_sum(0, 0) {}
    explicit fenwick_range_sum(int n, int m) : t(n, m), ti(n, m), tj(n, m), tij(n, m) {}
    fenwick_range_sum(fenwick_range_sum const&) = default;
    fenwick_range_sum(fenwick_range_sum&&) = default;
    fenwick_range_sum& operator=(fenwick_range_sum const&) = default;
    fenwick_range_sum& operator=(fenwick_range_sum&&) = default;

    void add(int il, int jl, int ir, int jr, T x) {
        auto [n, m] = t.size();
        assert(0 <= il && il <= ir && ir <= n && 0 <= jl && jl <= jr && jr <= m);
        add_(il, jl, x);
        if (ir < n) add_(ir, jl, -x);
        if (jr < m) add_(il, jr, -x);
        if (ir < n && jr < m) add_(ir, jr, x);
    }
    T sum(int il, int jl, int ir, int jr) const {
        auto [n, m] = t.size();
        assert(0 <= il && il <= ir && ir <= n && 0 <= jl && jl <= jr && jr <= m);
        --il, --jl, --ir, --jr;
        return prefix_sum_(ir, jr) - prefix_sum_(il, jr) - prefix_sum_(ir, jl) + prefix_sum_(il, jl);
    }
    std::pair<int, int> size() const { return t.size(); }
};
using namespace std;
using ll = long long;
using fenwick_2d = fenwick_range_sum<ll>;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M, op, il, jl, ir, jr;
    ll x;
    cin >> N >> M;
    fenwick_2d fw(N, M);
    while (cin >> op >> il >> jl >> ir >> jr) {
        --il, --jl;
        if (op == 1) {
            cin >> x;
            fw.add(il, jl, ir, jr, x);
        } else {
            cout << fw.sum(il, jl, ir, jr) << '\n';
        }
    }
}
```

{% endcontentbox %}
