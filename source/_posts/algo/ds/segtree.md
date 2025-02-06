---
title: 线段树
date: 2023-12-01 18:30:55
tags:
  - 算法
  - 数据结构
  - 线段树
categories:
  - [算法, 数据结构]
---

# 线段树

> 参考：<https://github.com/atcoder/ac-library>

## 1. 模板

模板的接口文档在[这里](https://atcoder.github.io/ac-library/production/document_en/segtree.html)，使用方法参考例题代码中的注释。线段树只支持单点修改、区间查询，区间修改、单点查询需要用到的懒标记线段树见 {% post_link 懒标记线段树 '懒标记线段树的模板' %} 。

{% contentbox "cpp &lt;atcoder/segtree&gt;" type:code %}

```cpp
#include <algorithm>
#include <cassert>
#include <functional>
#include <vector>


#ifdef _MSC_VER
#include <intrin.h>
#endif

#if __cplusplus >= 202002L
#include <bit>
#endif

namespace atcoder {

namespace internal {

#if __cplusplus >= 202002L

using std::bit_ceil;

#else

unsigned int bit_ceil(unsigned int n) {
    unsigned int x = 1;
    while (x < (unsigned int)(n)) x *= 2;
    return x;
}

#endif

int countr_zero(unsigned int n) {
#ifdef _MSC_VER
    unsigned long index;
    _BitScanForward(&index, n);
    return index;
#else
    return __builtin_ctz(n);
#endif
}

constexpr int countr_zero_constexpr(unsigned int n) {
    int x = 0;
    while (!(n & (1 << x))) x++;
    return x;
}

}  // namespace internal

}  // namespace atcoder


namespace atcoder {

#if __cplusplus >= 201703L

template <class S, auto op, auto e> struct segtree {
    static_assert(std::is_convertible_v<decltype(op), std::function<S(S, S)>>,
                  "op must work as S(S, S)");
    static_assert(std::is_convertible_v<decltype(e), std::function<S()>>,
                  "e must work as S()");

#else

template <class S, S (*op)(S, S), S (*e)()> struct segtree {

#endif

  public:
    segtree() : segtree(0) {}
    explicit segtree(int n) : segtree(std::vector<S>(n, e())) {}
    explicit segtree(const std::vector<S>& v) : _n(int(v.size())) {
        size = (int)internal::bit_ceil((unsigned int)(_n));
        log = internal::countr_zero((unsigned int)size);
        d = std::vector<S>(2 * size, e());
        for (int i = 0; i < _n; i++) d[size + i] = v[i];
        for (int i = size - 1; i >= 1; i--) {
            update(i);
        }
    }

    void set(int p, S x) {
        assert(0 <= p && p < _n);
        p += size;
        d[p] = x;
        for (int i = 1; i <= log; i++) update(p >> i);
    }

    S get(int p) const {
        assert(0 <= p && p < _n);
        return d[p + size];
    }

    S prod(int l, int r) const {
        assert(0 <= l && l <= r && r <= _n);
        S sml = e(), smr = e();
        l += size;
        r += size;

        while (l < r) {
            if (l & 1) sml = op(sml, d[l++]);
            if (r & 1) smr = op(d[--r], smr);
            l >>= 1;
            r >>= 1;
        }
        return op(sml, smr);
    }

    S all_prod() const { return d[1]; }

    template <bool (*f)(S)> int max_right(int l) const {
        return max_right(l, [](S x) { return f(x); });
    }
    template <class F> int max_right(int l, F f) const {
        assert(0 <= l && l <= _n);
        assert(f(e()));
        if (l == _n) return _n;
        l += size;
        S sm = e();
        do {
            while (l % 2 == 0) l >>= 1;
            if (!f(op(sm, d[l]))) {
                while (l < size) {
                    l = (2 * l);
                    if (f(op(sm, d[l]))) {
                        sm = op(sm, d[l]);
                        l++;
                    }
                }
                return l - size;
            }
            sm = op(sm, d[l]);
            l++;
        } while ((l & -l) != l);
        return _n;
    }

    template <bool (*f)(S)> int min_left(int r) const {
        return min_left(r, [](S x) { return f(x); });
    }
    template <class F> int min_left(int r, F f) const {
        assert(0 <= r && r <= _n);
        assert(f(e()));
        if (r == 0) return 0;
        r += size;
        S sm = e();
        do {
            r--;
            while (r > 1 && (r % 2)) r >>= 1;
            if (!f(op(d[r], sm))) {
                while (r < size) {
                    r = (2 * r + 1);
                    if (f(op(d[r], sm))) {
                        sm = op(d[r], sm);
                        r--;
                    }
                }
                return r + 1 - size;
            }
            sm = op(d[r], sm);
        } while ((r & -r) != r);
        return 0;
    }

  private:
    int _n, size, log;
    std::vector<S> d;

    void update(int k) { d[k] = op(d[2 * k], d[2 * k + 1]); }
};

}  // namespace atcoder
```

{% endcontentbox %}

以及使用和其它模板中一样的递归方式实现`prod`的版本：

{% contentbox "cpp &lt;atcoder/segtree&gt;" type:code %}

```cpp
#include <algorithm>
#include <cassert>
#include <functional>
#include <vector>


#ifdef _MSC_VER
#include <intrin.h>
#endif

#if __cplusplus >= 202002L
#include <bit>
#endif

namespace atcoder {

namespace internal {

#if __cplusplus >= 202002L

using std::bit_ceil;

#else

unsigned int bit_ceil(unsigned int n) {
    unsigned int x = 1;
    while (x < (unsigned int)(n)) x *= 2;
    return x;
}

#endif

int countr_zero(unsigned int n) {
#ifdef _MSC_VER
    unsigned long index;
    _BitScanForward(&index, n);
    return index;
#else
    return __builtin_ctz(n);
#endif
}

constexpr int countr_zero_constexpr(unsigned int n) {
    int x = 0;
    while (!(n & (1 << x))) x++;
    return x;
}

}  // namespace internal

}  // namespace atcoder


namespace atcoder {

#if __cplusplus >= 201703L

template <class S, auto op, auto e> struct segtree {
    static_assert(std::is_convertible_v<decltype(op), std::function<S(S, S)>>,
                  "op must work as S(S, S)");
    static_assert(std::is_convertible_v<decltype(e), std::function<S()>>,
                  "e must work as S()");

#else

template <class S, S (*op)(S, S), S (*e)()> struct segtree {

#endif

  public:
    segtree() : segtree(0) {}
    explicit segtree(int n) : segtree(std::vector<S>(n, e())) {}
    explicit segtree(const std::vector<S>& v) : _n(int(v.size())) {
        size = (int)internal::bit_ceil((unsigned int)(_n));
        log = internal::countr_zero((unsigned int)size);
        d = std::vector<S>(2 * size, e());
        for (int i = 0; i < _n; i++) d[size + i] = v[i];
        for (int i = size - 1; i >= 1; i--) {
            update(i);
        }
    }

    void set(int p, S x) {
        assert(0 <= p && p < _n);
        p += size;
        d[p] = x;
        for (int i = 1; i <= log; i++) update(p >> i);
    }

    S get(int p) const {
        assert(0 <= p && p < _n);
        return d[p + size];
    }

   private:
    S _prod(int l, int r, int s, int t, int p) const {
        // [l, r] 为查询区间, [s, t] 为当前节点包含的区间, p 为当前节点的编号
        if (l <= s && t <= r) return d[p];
        int m = s + ((t - s) >> 1);
        S res = e();
        if (l <= m) res = op(res, _prod(l, r, s, m, (p << 1)));
        if (r > m) res = op(res, _prod(l, r, m + 1, t, (p << 1) | 1));
        return res;
    }

   public:
    S prod(int l, int r) const {
        assert(0 <= l && l <= r && r <= _n);
        if (l == r) return e();
        return _prod(l, r - 1, 0, size - 1, 1);
    }

    S all_prod() const { return d[1]; }

    // TODO: vvv 改为以递归方式实现 vvv
    template <bool (*f)(S)> int max_right(int l) const {
        return max_right(l, [](S x) { return f(x); });
    }
    template <class F> int max_right(int l, F f) const {
        assert(0 <= l && l <= _n);
        assert(f(e()));
        if (l == _n) return _n;
        l += size;
        S sm = e();
        do {
            while (l % 2 == 0) l >>= 1;
            if (!f(op(sm, d[l]))) {
                while (l < size) {
                    l = (2 * l);
                    if (f(op(sm, d[l]))) {
                        sm = op(sm, d[l]);
                        l++;
                    }
                }
                return l - size;
            }
            sm = op(sm, d[l]);
            l++;
        } while ((l & -l) != l);
        return _n;
    }

    template <bool (*f)(S)> int min_left(int r) const {
        return min_left(r, [](S x) { return f(x); });
    }
    template <class F> int min_left(int r, F f) const {
        assert(0 <= r && r <= _n);
        assert(f(e()));
        if (r == 0) return 0;
        r += size;
        S sm = e();
        do {
            r--;
            while (r > 1 && (r % 2)) r >>= 1;
            if (!f(op(d[r], sm))) {
                while (r < size) {
                    r = (2 * r + 1);
                    if (f(op(d[r], sm))) {
                        sm = op(d[r], sm);
                        r--;
                    }
                }
                return r + 1 - size;
            }
            sm = op(d[r], sm);
        } while ((r & -r) != r);
        return 0;
    }

  private:
    int _n, size, log;
    std::vector<S> d;

    void update(int k) { d[k] = op(d[2 * k], d[2 * k + 1]); }
};

}  // namespace atcoder
```

{% endcontentbox %}

## 2. 例题

### 2.1 [洛谷P3374](https://www.luogu.com.cn/problem/P3374) 单点修改，查询区间和

> - `1 x k` 将第 `x` 个数加上 `k`
> - `2 l r` 输出区间 `[l, r]` 内每个数的和

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

#include <atcoder/segtree>

using namespace std;

// S: 幺半群内元素的定义
using S = int;
// op: 幺半群内元素的二元运算，需要满足结合律和封闭性
S op(S a, S b) { return a + b; }
// e: 单位元
S e() { return 0; }

using segtree = atcoder::segtree<S, op, e>;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<int> a(N);
    for (auto &x : a) cin >> x;
    segtree seg(a);
    while (M--) {
        int op, x, y;
        cin >> op >> x >> y;
        if (op == 1) {
            seg.set(x - 1, seg.get(x - 1) + y);
        } else {
            cout << seg.prod(x - 1, y) << "\n";
        }
    }
}
```

{% endcontentbox %}

### 2.2 [CF2057D](https://codeforces.com/contest/2057/problem/D) 单点修改，查询全局区间最值

查询 $\operatorname{max} (a_l, a_{l + 1}, \ldots, a_r) - \operatorname{min} (a_l, a_{l + 1}, \ldots, a_r) - (r - l)$ 的最大值。

思路：

- 若 $a_l > a_r$ ，则答案为 $a_l - a_r - (r - l) = (a_l + l) - (a_r + r)$
- 若 $a_l < a_r$ ，则答案为 $a_r - a_l - (r - l) = (a_r - r) - (a_l - l)$

用线段树维护 $a_i + i$ 和 $a_i - i$ 的最大值和最小值，在合并区间时维护答案。

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>

#include <atcoder/segtree>

using namespace std;
using ll = long long;
constexpr auto INF = numeric_limits<ll>::max() / 4;

struct S {
    ll sub_min, add_min;
    ll sub_max, add_max;
    ll ans;
};
S get_S(ll x, int i) {
    S s;
    s.sub_min = s.sub_max = x - i;
    s.add_min = s.add_max = x + i;
    s.ans = 0;
    return s;
}
constexpr S op(S lhs, S rhs) {
    S ans;
    ans.sub_min = min(lhs.sub_min, rhs.sub_min);
    ans.add_min = min(lhs.add_min, rhs.add_min);
    ans.sub_max = max(lhs.sub_max, rhs.sub_max);
    ans.add_max = max(lhs.add_max, rhs.add_max);
    ans.ans = max({lhs.ans, rhs.ans, rhs.sub_max - lhs.sub_min, lhs.add_max - rhs.add_min});
    return ans;
}
constexpr S e() { return {INF, INF, -INF, -INF, 0}; }
using segtree = atcoder::segtree<S, op, e>;
void solve() {
    int N, Q;
    cin >> N >> Q;
    vector<S> b(N);
    for (int i = 0, x; i < N; ++i) cin >> x, b[i] = get_S(x, i);
    segtree seg(b);
    cout << seg.all_prod().ans << '\n';
    for (int p, x; Q--;) {
        cin >> p >> x;
        --p;
        seg.set(p, get_S(x, p));
        cout << seg.all_prod().ans << '\n';
    }
}

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int T;
    cin >> T;
    while (T--) solve();
}
```

{% endcontentbox %}
