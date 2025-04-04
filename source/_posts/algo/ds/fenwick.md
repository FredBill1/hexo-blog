---
title: 树状数组
date: 2023-12-25 17:59:40
tags:
  - 算法
  - 数据结构
  - 树状数组
  - 逆序对
  - 权值数组
  - 倍增
categories:
  - [算法, 数据结构]
---

# 树状数组

> 参考：<https://oi-wiki.org/ds/fenwick>

## 1. 模板

{% contentbox "cpp &lt;fenwick_tree&gt;" type:code %}

```cpp
#include <bits/stdc++.h>
#if (1)
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
#else   // if (1)
int countl_zero(unsigned int n) {
    int res = 0;
    while (!(x & 0x80000000)) ++res, x <<= 1;
    return res;
}
#endif  // if (1)
template <class T, T (*e)(), T (*sum)(T, T), T (*diff)(T, T) = nullptr>
class fenwick_tree {
   protected:
    int n_;
    std::vector<T> data_;

   public:
    fenwick_tree() : fenwick_tree(0) {}
    explicit fenwick_tree(int n) : n_(n), data_(n, e()) {}
    explicit fenwick_tree(const std::vector<T>& a) : n_(int(a.size())), data_(a.size(), e()) {
        for (int p = 1; p <= n_; ++p) {
            data_[p - 1] = sum(data_[p - 1], a[p - 1]);
            if (int q = p + (p & -p); q <= n_) data_[q - 1] = sum(data_[q - 1], data_[p - 1]);
        }
    }
    fenwick_tree(fenwick_tree const&) = default;
    fenwick_tree(fenwick_tree&&) = default;
    fenwick_tree& operator=(fenwick_tree const&) = default;
    fenwick_tree& operator=(fenwick_tree&&) = default;

    void add(int p, T x) {
        assert(0 <= p && p < n_);
        ++p;
        while (p <= n_) {
            data_[p - 1] = sum(data_[p - 1], x);
            p += p & -p;
        }
    }
    T prefix_sum(int p) const {
        assert(-1 <= p && p < n_);
        ++p;
        T s = e();
        while (p > 0) {
            s = sum(s, data_[p - 1]);
            p -= p & -p;
        }
        return s;
    }
    T sum_range(int l, int r) const {
        assert(0 <= l && l <= r && r <= n_);
        static_assert(diff != nullptr);
        return diff(prefix_sum(r - 1), prefix_sum(l - 1));
    }
    int kth(T k) const {
        T s = 0;
        int x = 0;
        for (int i = 31 - countl_zero(n_); i >= 0; --i) {
            x += 1 << i;
            if (x >= n_ || sum(s, data_[x - 1]) >= k)
                x -= 1 << i;
            else
                s = sum(s, data_[x - 1]);
        }
        return x;
    }
    int size() const { return n_; }
};
template <class T>
struct _fenwick_sum {
    static T e() { return 0; }
    static T sum(T a, T b) { return a + b; }
    static T diff(T a, T b) { return a - b; }
    using type = fenwick_tree<T, e, sum, diff>;
};
template <class T>
using fenwick_sum = typename _fenwick_sum<T>::type;
```

{% endcontentbox %}

{% contentbox "python FenwickTree.py" type:code %}

```python
class FenwickTree:
    def __init__(self, n: int) -> None:
        self._n = n
        self._a = [0] * n

    @classmethod
    def from_list(cls, arr: list[int]) -> "FenwickTree":
        fw = cls(len(arr))
        for i in range(1, fw._n + 1):
            fw._a[i - 1] += arr[i - 1]
            if (j := i + (i & -i)) <= fw._n:
                fw._a[j - 1] += fw._a[i - 1]
        return fw

    def add(self, i: int, x: int) -> None:
        assert 0 <= i < self._n
        i += 1
        while i <= self._n:
            self._a[i - 1] += x
            i += i & -i

    def prefix_sum(self, i: int) -> int:
        assert -1 <= i < self._n
        i += 1
        res = 0
        while i > 0:
            res += self._a[i - 1]
            i -= i & -i
        return res

    def sum_range(self, l: int, r: int) -> int:
        assert 0 <= l <= r <= self._n
        return self.prefix_sum(r - 1) - self.prefix_sum(l - 1)

    @property
    def n(self) -> int:
        return self._n
```

{% endcontentbox %}

## 2. 例题

### 2.1 [LibreOJ #130](https://loj.ac/p/130) 单点加，查询区间和

> - `1 x k` 将第 `x` 个数加上 `k`
> - `2 l r` 输出区间 `[l, r]` 内每个数的和

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <fenwick_tree>
using namespace std;
using T = long long;
using fenwick = fenwick_sum<T>;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<T> a(N);
    for (auto& x : a) cin >> x;
    fenwick fw(a);
    while (M--) {
        int op, a, b;
        cin >> op >> a >> b;
        if (op == 1) {
            fw.add(a - 1, b);
        } else {
            cout << fw.sum_range(a - 1, b) << '\n';
        }
    }
}
```

{% endcontentbox %}

### 2.2 [LibreOJ #131](https://loj.ac/p/131) 区间加，查询单点值

> - `1 l r k` 将区间 `[l, r]` 内每个数加上 `k`
> - `2 p` 输出第 `p` 个数的值

思路是用树状数组维护原数组的差分数组，差分数组的前缀和就是原数组的值。

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <fenwick_tree>
using T = long long;
using fenwick = fenwick_sum<T>;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<T> a(N);
    for (auto& x : a) cin >> x;
    for (int i = N - 1; i > 0; --i) a[i] -= a[i - 1];
    fenwick fw(a);
    while (M--) {
        int op;
        cin >> op;
        if (op == 1) {
            int l, r, v;
            cin >> l >> r >> v;
            fw.add(l - 1, v);
            if (r < N) fw.add(r, -v);
        } else {
            int p;
            cin >> p;
            cout << fw.prefix_sum(p - 1) << '\n';
        }
    }
}
```

{% endcontentbox %}

### 2.3 [LibreOJ #132](https://loj.ac/p/132) 区间加，查询区间和

> - `1 l r k` 将区间 `[l, r]` 内每个数加上 `k`
> - `2 l r` 输出区间 `[l, r]` 内每个数的和

思路见<https://oi-wiki.org/ds/fenwick/#区间加区间和>

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <fenwick_tree>
template <class T>
class fenwick_range_sum {
    using fenwick = fenwick_sum<T>;
    fenwick t1, t2;
    void add_(int p, T x) {
        t1.add(p, x);
        t2.add(p, x * p);
    }

   public:
   fenwick_range_sum() : fenwick_range_sum(0) {}
    explicit fenwick_range_sum(int n) : t1(n), t2(n) {}
    explicit fenwick_range_sum(std::vector<T>&& a) {
        for (int i = a.size() - 1; i > 0; --i) a[i] -= a[i - 1];
        t1 = fenwick(a);
        for (int i = 0; i < a.size(); ++i) a[i] *= i;
        t2 = fenwick(a);
        a.clear();
    }
    explicit fenwick_range_sum(std::vector<T> const& a) : fenwick_range_sum(std::vector<T>(a)) {}
    fenwick_range_sum(fenwick_range_sum const&) = default;
    fenwick_range_sum(fenwick_range_sum&&) = default;
    fenwick_range_sum& operator=(fenwick_range_sum const&) = default;
    fenwick_range_sum& operator=(fenwick_range_sum&&) = default;

    void add(int l, int r, T x) {
        assert(0 <= l && l <= r && r <= t1.size());
        add_(l, x);
        if (r < t1.size()) add_(r, -x);
    }
    T sum(int l, int r) const {
        assert(0 <= l && l <= r && r <= t1.size());
        return t1.prefix_sum(r - 1) * r - t1.prefix_sum(l - 1) * l - t2.sum_range(l, r);
    }
    int size() const { return t1.size(); }
};

using namespace std;
using T = long long;
using fenwick = fenwick_range_sum<T>;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<T> a(N);
    for (auto& x : a) cin >> x;
    fenwick fw(std::move(a));
    while (M--) {
        int op, l, r, v;
        cin >> op >> l >> r;
        if (op == 1) {
            cin >> v;
            fw.add(l - 1, r, v);
        } else {
            cout << fw.sum(l - 1, r) << '\n';
        }
    }
}
```

{% endcontentbox %}

### 2.4 [洛谷P1908](https://www.luogu.com.cn/problem/P1908) 全局逆序对数量

> 权值数组：一个序列 $a$ 的权值数组 $b$，满足 $b[x]$ 的值为 $x$ 在 $a$ 中的出现次数。

思路是把输入序列离散化，用树状数组维护**权值数组**。权值数组的前缀和就是比当前数小的数的个数。

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <fenwick_tree>
using namespace std;
using fenwick = fenwick_sum<int>;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N;
    cin >> N;
    vector<int> a(N);
    for (auto& x : a) cin >> x;
    auto b = a;
    sort(begin(b), end(b)), b.erase(unique(begin(b), end(b)), end(b));
    for (auto& x : a) x = lower_bound(begin(b), end(b), x) - begin(b);
    fenwick fw(N);
    ll ans = 0;
    for (auto x : views::reverse(a)) {
        ans += fw.prefix_sum(x - 1);
        fw.add(x, 1);
    }
    cout << ans;
}
```

{% endcontentbox %}

### 2.5 [牛客61132L](https://ac.nowcoder.com/acm/contest/61132/L) 单点修改，查询序列第k小的值

> - `p x` 将第 `p` 个数修改为 `x`，并输出修改后序列的中位数

思路是用树状数组维护权值数组，用倍增的方法(`kth`)求序列中第 $(N+1)/2$ 小的值。

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <fenwick_tree>
using namespace std;
using fenwick = fenwick_sum<int>;
using ll = long long;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<int> a(N);
    fenwick fw(int(1e6) + 1);
    for (auto& x : a) cin >> x, fw.add(x, 1);
    while (M--) {
        int p, x;
        cin >> p >> x;
        fw.add(a[p - 1], -1);
        a[p - 1] = x;
        fw.add(a[p - 1], 1);
        cout << fw.kth((N + 1) / 2) << '\n';
    }
}
```

{% endcontentbox %}
