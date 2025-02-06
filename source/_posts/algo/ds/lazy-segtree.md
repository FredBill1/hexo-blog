---
title: 懒标记线段树
date: 2023-11-18 14:08:22
tags:
  - 算法
  - 数据结构
  - 线段树
categories:
  - [算法, 数据结构]
---

# 懒标记线段树

> 参考：<https://github.com/atcoder/ac-library>

## 1. 模板

模板的接口文档在[这里](https://atcoder.github.io/ac-library/production/document_en/lazysegtree.html)，使用方法参考例题代码中的注释。

{% contentbox "cpp &lt;atcoder/lazysegtree&gt;" type:code %}

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

template <class S,
          auto op,
          auto e,
          class F,
          auto mapping,
          auto composition,
          auto id>
struct lazy_segtree {
    static_assert(std::is_convertible_v<decltype(op), std::function<S(S, S)>>,
                  "op must work as S(S, S)");
    static_assert(std::is_convertible_v<decltype(e), std::function<S()>>,
                  "e must work as S()");
    static_assert(
        std::is_convertible_v<decltype(mapping), std::function<S(F, S)>>,
        "mapping must work as F(F, S)");
    static_assert(
        std::is_convertible_v<decltype(composition), std::function<F(F, F)>>,
        "compostiion must work as F(F, F)");
    static_assert(std::is_convertible_v<decltype(id), std::function<F()>>,
                  "id must work as F()");

#else

template <class S,
          S (*op)(S, S),
          S (*e)(),
          class F,
          S (*mapping)(F, S),
          F (*composition)(F, F),
          F (*id)()>
struct lazy_segtree {

#endif

  public:
    lazy_segtree() : lazy_segtree(0) {}
    explicit lazy_segtree(int n) : lazy_segtree(std::vector<S>(n, e())) {}
    explicit lazy_segtree(const std::vector<S>& v) : _n(int(v.size())) {
        size = (int)internal::bit_ceil((unsigned int)(_n));
        log = internal::countr_zero((unsigned int)size);
        d = std::vector<S>(2 * size, e());
        lz = std::vector<F>(size, id());
        for (int i = 0; i < _n; i++) d[size + i] = v[i];
        for (int i = size - 1; i >= 1; i--) {
            update(i);
        }
    }

    void set(int p, S x) {
        assert(0 <= p && p < _n);
        p += size;
        for (int i = log; i >= 1; i--) push(p >> i);
        d[p] = x;
        for (int i = 1; i <= log; i++) update(p >> i);
    }

    S get(int p) {
        assert(0 <= p && p < _n);
        p += size;
        for (int i = log; i >= 1; i--) push(p >> i);
        return d[p];
    }

    S prod(int l, int r) {
        assert(0 <= l && l <= r && r <= _n);
        if (l == r) return e();

        l += size;
        r += size;

        for (int i = log; i >= 1; i--) {
            if (((l >> i) << i) != l) push(l >> i);
            if (((r >> i) << i) != r) push((r - 1) >> i);
        }

        S sml = e(), smr = e();
        while (l < r) {
            if (l & 1) sml = op(sml, d[l++]);
            if (r & 1) smr = op(d[--r], smr);
            l >>= 1;
            r >>= 1;
        }

        return op(sml, smr);
    }

    S all_prod() { return d[1]; }

    void apply(int p, F f) {
        assert(0 <= p && p < _n);
        p += size;
        for (int i = log; i >= 1; i--) push(p >> i);
        d[p] = mapping(f, d[p]);
        for (int i = 1; i <= log; i++) update(p >> i);
    }
    void apply(int l, int r, F f) {
        assert(0 <= l && l <= r && r <= _n);
        if (l == r) return;

        l += size;
        r += size;

        for (int i = log; i >= 1; i--) {
            if (((l >> i) << i) != l) push(l >> i);
            if (((r >> i) << i) != r) push((r - 1) >> i);
        }

        {
            int l2 = l, r2 = r;
            while (l < r) {
                if (l & 1) all_apply(l++, f);
                if (r & 1) all_apply(--r, f);
                l >>= 1;
                r >>= 1;
            }
            l = l2;
            r = r2;
        }

        for (int i = 1; i <= log; i++) {
            if (((l >> i) << i) != l) update(l >> i);
            if (((r >> i) << i) != r) update((r - 1) >> i);
        }
    }

    template <bool (*g)(S)> int max_right(int l) {
        return max_right(l, [](S x) { return g(x); });
    }
    template <class G> int max_right(int l, G g) {
        assert(0 <= l && l <= _n);
        assert(g(e()));
        if (l == _n) return _n;
        l += size;
        for (int i = log; i >= 1; i--) push(l >> i);
        S sm = e();
        do {
            while (l % 2 == 0) l >>= 1;
            if (!g(op(sm, d[l]))) {
                while (l < size) {
                    push(l);
                    l = (2 * l);
                    if (g(op(sm, d[l]))) {
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

    template <bool (*g)(S)> int min_left(int r) {
        return min_left(r, [](S x) { return g(x); });
    }
    template <class G> int min_left(int r, G g) {
        assert(0 <= r && r <= _n);
        assert(g(e()));
        if (r == 0) return 0;
        r += size;
        for (int i = log; i >= 1; i--) push((r - 1) >> i);
        S sm = e();
        do {
            r--;
            while (r > 1 && (r % 2)) r >>= 1;
            if (!g(op(d[r], sm))) {
                while (r < size) {
                    push(r);
                    r = (2 * r + 1);
                    if (g(op(d[r], sm))) {
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
    std::vector<F> lz;

    void update(int k) { d[k] = op(d[2 * k], d[2 * k + 1]); }
    void all_apply(int k, F f) {
        d[k] = mapping(f, d[k]);
        if (k < size) lz[k] = composition(f, lz[k]);
    }
    void push(int k) {
        all_apply(2 * k, lz[k]);
        all_apply(2 * k + 1, lz[k]);
        lz[k] = id();
    }
};

}  // namespace atcoder
```

{% endcontentbox %}

以及使用和其它模板中一样的递归方式实现`prod`和`apply`的版本：

{% contentbox "cpp &lt;atcoder/lazysegtree&gt;" type:code %}

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

template <class S,
          auto op,
          auto e,
          class F,
          auto mapping,
          auto composition,
          auto id>
struct lazy_segtree {
    static_assert(std::is_convertible_v<decltype(op), std::function<S(S, S)>>,
                  "op must work as S(S, S)");
    static_assert(std::is_convertible_v<decltype(e), std::function<S()>>,
                  "e must work as S()");
    static_assert(
        std::is_convertible_v<decltype(mapping), std::function<S(F, S)>>,
        "mapping must work as F(F, S)");
    static_assert(
        std::is_convertible_v<decltype(composition), std::function<F(F, F)>>,
        "compostiion must work as F(F, F)");
    static_assert(std::is_convertible_v<decltype(id), std::function<F()>>,
                  "id must work as F()");

#else

template <class S,
          S (*op)(S, S),
          S (*e)(),
          class F,
          S (*mapping)(F, S),
          F (*composition)(F, F),
          F (*id)()>
struct lazy_segtree {

#endif

   public:
    lazy_segtree() : lazy_segtree(0) {}
    explicit lazy_segtree(int n) : lazy_segtree(std::vector<S>(n, e())) {}
    explicit lazy_segtree(const std::vector<S>& v) : _n(int(v.size())) {
        size = (int)internal::bit_ceil((unsigned int)(_n));
        log = internal::countr_zero((unsigned int)size);
        d = std::vector<S>(2 * size, e());
        lz = std::vector<F>(size, id());
        for (int i = 0; i < _n; i++) d[size + i] = v[i];
        for (int i = size - 1; i >= 1; i--) {
            update(i);
        }
    }

    void set(int p, S x) {
        assert(0 <= p && p < _n);
        p += size;
        for (int i = log; i >= 1; i--) push(p >> i);
        d[p] = x;
        for (int i = 1; i <= log; i++) update(p >> i);
    }

    S get(int p) {
        assert(0 <= p && p < _n);
        p += size;
        for (int i = log; i >= 1; i--) push(p >> i);
        return d[p];
    }

   private:
    S _prod(int l, int r, int s, int t, int p) {
        // [l, r] 为查询区间, [s, t] 为当前节点包含的区间, p 为当前节点的编号
        if (l <= s && t <= r) return d[p];
        if (p < size) push(p);
        int m = s + ((t - s) >> 1);
        S res = e();
        if (l <= m) res = _prod(l, r, s, m, (p << 1));
        if (m < r) res = op(res, _prod(l, r, m + 1, t, (p << 1) | 1));
        return res;
    }

   public:
    S prod(int l, int r) {
        assert(0 <= l && l <= r && r <= _n);
        if (l == r) return e();
        return _prod(l, r - 1, 0, size - 1, 1);
    }

    S all_prod() { return d[1]; }

    void apply(int p, F f) {
        assert(0 <= p && p < _n);
        p += size;
        for (int i = log; i >= 1; i--) push(p >> i);
        d[p] = mapping(f, d[p]);
        for (int i = 1; i <= log; i++) update(p >> i);
    }

   private:
    void _apply(int l, int r, F f, int s, int t, int p) {
        // [l, r] 为查询区间, [s, t] 为当前节点包含的区间, p 为当前节点的编号
        if (l <= s && t <= r) {
            all_apply(p, f);
            return;
        }
        if (p < size) push(p);
        int m = s + ((t - s) >> 1);
        if (l <= m) _apply(l, r, f, s, m, (p << 1));
        if (m < r) _apply(l, r, f, m + 1, t, (p << 1) | 1);
        update(p);
    }

   public:
    void apply(int l, int r, F f) {
        assert(0 <= l && l <= r && r <= _n);
        if (l == r) return;
        _apply(l, r - 1, f, 0, size - 1, 1);
    }

    // TODO: vvv 改为以递归方式实现 vvv
    template <bool (*g)(S)>
    int max_right(int l) {
        return max_right(l, [](S x) { return g(x); });
    }
    template <class G>
    int max_right(int l, G g) {
        assert(0 <= l && l <= _n);
        assert(g(e()));
        if (l == _n) return _n;
        l += size;
        for (int i = log; i >= 1; i--) push(l >> i);
        S sm = e();
        do {
            while (l % 2 == 0) l >>= 1;
            if (!g(op(sm, d[l]))) {
                while (l < size) {
                    push(l);
                    l = (2 * l);
                    if (g(op(sm, d[l]))) {
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

    template <bool (*g)(S)>
    int min_left(int r) {
        return min_left(r, [](S x) { return g(x); });
    }
    template <class G>
    int min_left(int r, G g) {
        assert(0 <= r && r <= _n);
        assert(g(e()));
        if (r == 0) return 0;
        r += size;
        for (int i = log; i >= 1; i--) push((r - 1) >> i);
        S sm = e();
        do {
            r--;
            while (r > 1 && (r % 2)) r >>= 1;
            if (!g(op(d[r], sm))) {
                while (r < size) {
                    push(r);
                    r = (2 * r + 1);
                    if (g(op(d[r], sm))) {
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
    std::vector<F> lz;

    void update(int k) { d[k] = op(d[2 * k], d[2 * k + 1]); }
    void all_apply(int k, F f) {
        d[k] = mapping(f, d[k]);
        if (k < size) lz[k] = composition(f, lz[k]);
    }
    void push(int k) {
        all_apply(2 * k, lz[k]);
        all_apply(2 * k + 1, lz[k]);
        lz[k] = id();
    }
};

}  // namespace atcoder
```

{% endcontentbox %}

还有好背Python版：

{% contentbox "python LazySegtree.py" type:code %}

```python
from collections.abc import Callable
from typing import Generic, TypeVar, Union

S = TypeVar("S")
F = TypeVar("F")


class LazySegtree(Generic[S, F]):
    def __init__(
        self,
        arr_or_N: Union[list[S], int],
        op: Callable[[S, S], S],
        e: Callable[[], S],
        mapping: Callable[[F, S], S],
        composition: Callable[[F, F], F],
        id: Callable[[], F],
    ) -> None:
        self._op = op
        self._e = e
        self._mapping = mapping
        self._composition = composition
        self._id = id

        self._N = arr_or_N if isinstance(arr_or_N, int) else len(arr_or_N)
        self._d = [self._e() for _ in range(4 * self._N)]
        self._lz = [self._id() for _ in range(4 * self._N)]

        if not isinstance(arr_or_N, int):

            def _build(i: int, l: int, r: int) -> None:  # [l, r]
                if l == r:
                    self._d[i] = arr_or_N[l]
                    return
                m = (l + r) // 2
                _build(i * 2, l, m)
                _build(i * 2 + 1, m + 1, r)
                self._update(i)

            _build(1, 0, self._N - 1)

    def apply(self, l: int, r: int, f: F) -> None:  # [l, r)
        def _apply(i: int, tl: int, tr: int, ql: int, qr: int, f: F) -> None:  # [l, r]
            if qr < tl or tr < ql:  # [ql, qr] and [tl, tr] don't intersect
                return
            if ql <= tl and tr <= qr:  # [ql, qr] includes [tl, tr]
                self._all_apply(i, f)
                return
            self._push(i)
            tm = (tl + tr) // 2
            _apply(i * 2, tl, tm, ql, qr, f)
            _apply(i * 2 + 1, tm + 1, tr, ql, qr, f)
            self._update(i)

        return _apply(1, 0, self._N - 1, l, r - 1, f)

    def prod(self, l: int, r: int) -> S:  # [l, r)
        def _prod(i: int, tl: int, tr: int, ql: int, qr: int) -> S:  # [l, r]
            if qr < tl or tr < ql:  # [ql, qr] and [tl, tr] don't intersect
                return self._e()
            if ql <= tl and tr <= qr:  # [ql, qr] includes [tl, tr]
                return self._d[i]
            self._push(i)
            tm = (tl + tr) // 2
            return self._op(
                _prod(i * 2, tl, tm, ql, qr),
                _prod(i * 2 + 1, tm + 1, tr, ql, qr),
            )

        return _prod(1, 0, self._N - 1, l, r - 1)

    def all_prod(self) -> S:
        return self._d[1]

    def _update(self, i: int) -> None:
        self._d[i] = self._op(self._d[i * 2], self._d[i * 2 + 1])

    def _all_apply(self, i: int, f: F) -> None:
        self._d[i] = self._mapping(f, self._d[i])
        self._lz[i] = self._composition(f, self._lz[i])

    def _push(self, i: int) -> None:
        self._all_apply(i * 2, self._lz[i])
        self._all_apply(i * 2 + 1, self._lz[i])
        self._lz[i] = self._id()
```

{% endcontentbox %}

## 2. 例题

### 2.1 [洛谷P3372](https://www.luogu.com.cn/problem/P3372) 区间加法，查询区间和

> - `1 x y k` 将区间 `[x, y]` 内每个数加上 `k`
> - `2 x y` 输出区间 `[x, y]` 内每个数的和

{% contentbox cpp type:code %}

```cpp
#include <bits/stdc++.h>

#include <atcoder/lazysegtree>

using namespace std;
using ll = long long;

// S: 幺半群内元素的定义
struct S {
    ll sum = 0;
    int len = 0;
};
// op: 幺半群内元素的二元运算，需要满足结合律和封闭性
S op(S a, S b) { return {a.sum + b.sum, a.len + b.len}; }
// e: 单位元
S e() { return S{}; }
// F: 作用在幺半群上的函数的定义
using F = ll;
// mapping: 讲函数f作用在幺半群上元素S的函数，即mapping(f, x) = f(x)
S mapping(F f, S x) { return {x.sum + f * x.len, x.len}; }
// composition: 函数f和g的复合函数，即composition(f, g) = f.g，(f.g)(x) = f(g(x))
F composition(F f, F g) { return f + g; }
// id: 函数的单位元，即mapping(id, x) = id(x) = x
F id() { return 0; }

using segtree = atcoder::lazy_segtree<S, op, e, F, mapping, composition, id>;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<S> a(N);
    for (auto& x : a) cin >> x.sum, x.len = 1;
    segtree seg(a);

    while (M--) {
        int op, l, r;
        cin >> op >> l >> r;
        if (op == 1) {
            F k;
            cin >> k;
            seg.apply(l - 1, r, k);
        } else {
            cout << seg.prod(l - 1, r).sum << '\n';
        }
    }
}
```

{% endcontentbox %}

### 2.2 [洛谷P3373](https://www.luogu.com.cn/problem/P3373) 区间加、乘、取模，查询区间和

> - `1 x y k` 将区间 `[x,y]` 内每个数乘上 `k`
> - `2 x y k` 将区间 `[x,y]` 内每个数加上 `k`
> - `3 x y` 输出区间 `[x,y]` 内每个数的和对 `m` 取模所得的结果

{% contentbox cpp type:code %}

```cpp
#include <bits/stdc++.h>

#include <atcoder/lazysegtree>

using namespace std;
using ll = long long;

ll MOD;
// S: 幺半群内元素的定义
struct S {
    ll sum = 0;
    int len = 0;
};
// op: 幺半群内元素的二元运算，需要满足结合律和封闭性
S op(S a, S b) { return {(a.sum + b.sum) % MOD, a.len + b.len}; }
// e: 单位元
S e() { return S{}; }
// F: 作用在幺半群上的函数的定义
struct F {
    ll mul = 1;
    ll add = 0;
};
// mapping: 讲函数f作用在幺半群上元素S的函数，即mapping(f, x) = f(x)
S mapping(F f, S x) { return {(f.mul * x.sum % MOD + f.add * x.len % MOD) % MOD, x.len}; }
// composition: 函数f和g的复合函数，即composition(f, g) = f.g，(f.g)(x) = f(g(x))
F composition(F f, F g) { return {f.mul * g.mul % MOD, (f.mul * g.add % MOD + f.add) % MOD}; }
// id: 函数的单位元，即mapping(id, x) = id(x) = x
F id() { return F{}; }

using segtree = atcoder::lazy_segtree<S, op, e, F, mapping, composition, id>;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N >> M >> MOD;
    vector<S> a(N);
    for (auto& x : a) cin >> x.sum, x.len = 1;
    segtree seg(a);

    while (M--) {
        int op, l, r;
        F k;
        cin >> op >> l >> r;
        if (op == 1) {
            cin >> k.mul;
            seg.apply(l - 1, r, k);
        } else if (op == 2) {
            cin >> k.add;
            seg.apply(l - 1, r, k);
        } else {
            cout << seg.prod(l - 1, r).sum << '\n';
        }
    }
}
```

{% endcontentbox %}

或者用modint完成取模

{% contentbox cpp type:code %}

```cpp
#include <bits/stdc++.h>

#include <atcoder/lazysegtree>
#include <atcoder/modint>

using namespace std;
using mint = atcoder::modint;
// S: 幺半群内元素的定义
struct S {
    mint sum = 0;
    int len = 0;
};
// op: 幺半群内元素的二元运算，需要满足结合律和封闭性
S op(S a, S b) { return {a.sum + b.sum, a.len + b.len}; }
// e: 单位元
S e() { return S{}; }
// F: 作用在幺半群上的函数的定义
struct F {
    mint mul = 1;
    mint add = 0;
};
// mapping: 讲函数f作用在幺半群上元素S的函数，即mapping(f, x) = f(x)
S mapping(F f, S x) { return {f.mul * x.sum + f.add * x.len, x.len}; }
// composition: 函数f和g的复合函数，即composition(f, g) = f.g，(f.g)(x) = f(g(x))
F composition(F f, F g) { return {f.mul * g.mul, f.mul * g.add + f.add}; }
// id: 函数的单位元，即mapping(id, x) = id(x) = x
F id() { return F{}; }

using segtree = atcoder::lazy_segtree<S, op, e, F, mapping, composition, id>;

istream& operator>>(istream& is, mint& a) {
    int x;
    return cin >> x, a = x, is;
}

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M, MOD;
    cin >> N >> M >> MOD;
    mint::set_mod(MOD);
    vector<S> a(N);
    for (auto& x : a) cin >> x.sum, x.len = 1;
    segtree seg(a);

    while (M--) {
        int op, l, r;
        F k;
        cin >> op >> l >> r;
        if (op == 1) {
            cin >> k.mul;
            seg.apply(l - 1, r, k);
        } else if (op == 2) {
            cin >> k.add;
            seg.apply(l - 1, r, k);
        } else {
            cout << seg.prod(l - 1, r).sum.val() << '\n';
        }
    }
}
```

{% endcontentbox %}

### 2.3 [洛谷P4314](https://www.luogu.com.cn/problem/P4314) 区间加、赋值，查询区间最大值、历史最大值

> - `Q l r` 输出区间 `[l,r]` 中的最大值
> - `A l r` 输出区间 `[l,r]` 中历史出现过的最大值
> - `P l r k` 使得区间 `[l,r]` 中的所有数加上 `k`
> - `C l r k` 使得区间 `[l,r]` 中的所有数变成 `k`

{% contentbox cpp type:code %}

```cpp
#include <bits/stdc++.h>

#include <atcoder/lazysegtree>

using namespace std;
using ll = long long;
constexpr ll NEG_INF = -1e18;

// S: 幺半群内元素的定义
struct S {
    ll max = NEG_INF;          // 区间当前最大值
    ll history_max = NEG_INF;  // 区间历史最大值
};
// op: 幺半群内元素的二元运算，需要满足结合律和封闭性
S op(S a, S b) {
    return {
        .max = max(a.max, b.max),
        .history_max = max(a.history_max, b.history_max),
    };
}
// e: 单位元
S e() { return S{}; }

// F: 作用在幺半群上的函数的定义
struct F_add {
    ll add = 0;      // 这次add的值
    ll add_max = 0;  // 算上这次add的历史最大add值
};
struct F_set {
    ll set = NEG_INF;      // 这次set的值
    ll set_max = NEG_INF;  // 这次set之后的历史最大值
    ll add_max = 0;        // 这次set之前的历史最大增加量
};
using F = variant<F_add, F_set>;
// mapping: 讲函数f作用在幺半群上元素S的函数，即mapping(f, x) = f(x)
S mapping(F f, S x) {
    if (holds_alternative<F_add>(f)) {
        auto &f_add = get<F_add>(f);
        return {
            .max = x.max + f_add.add,
            .history_max = max(x.history_max, x.max + f_add.add_max),
        };
    } else {
        auto &f_set = get<F_set>(f);
        return {
            .max = f_set.set,
            .history_max = max({
                x.history_max,
                f_set.set_max,
                x.max + f_set.add_max,
            }),
        };
    }
}
// composition: 函数f和g的复合函数，即composition(f, g) = f.g，(f.g)(x) = f(g(x))
F composition(F f, F g) {
    if (holds_alternative<F_set>(f) && holds_alternative<F_set>(g)) {
        auto &f_set = get<F_set>(f);
        auto &g_set = get<F_set>(g);
        return F_set{
            .set = f_set.set,
            .set_max = max({f_set.set_max, f_set.add_max + g_set.set, g_set.set_max}),
            .add_max = g_set.add_max,
        };
    } else if (holds_alternative<F_set>(f)) {
        auto &f_set = get<F_set>(f);
        auto &g_add = get<F_add>(g);
        return F_set{
            .set = f_set.set,
            .set_max = f_set.set_max,
            .add_max = max(f_set.add_max + g_add.add, g_add.add_max),
        };
    } else if (holds_alternative<F_set>(g)) {
        auto &f_add = get<F_add>(f);
        auto &g_set = get<F_set>(g);
        return F_set{
            .set = f_add.add + g_set.set,
            .set_max = max(f_add.add_max + g_set.set, g_set.set_max),
            .add_max = g_set.add_max,
        };
    } else {
        auto &f_add = get<F_add>(f);
        auto &g_add = get<F_add>(g);
        return F_add{
            .add = f_add.add + g_add.add,
            .add_max = max(f_add.add_max + g_add.add, g_add.add_max),
        };
    }
}
// id: 函数的单位元，即mapping(id, x) = id(x) = x
F id() { return F_add{}; }

using segtree = atcoder::lazy_segtree<S, op, e, F, mapping, composition, id>;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N;
    vector<S> a(N);
    for (int i = 0; i < N; ++i) cin >> a[i].max, a[i].history_max = a[i].max;
    segtree seg(a);
    cin >> M;
    while (M--) {
        char op;
        int l, r;
        F k;
        cin >> op >> l >> r;
        switch (op) {
            case 'Q': { cout << seg.prod(l - 1, r).max << '\n'; } break;
            case 'A': { cout << seg.prod(l - 1, r).history_max << '\n'; } break;
            case 'P': {
                F_add k;
                cin >> k.add, k.add_max = k.add;
                seg.apply(l - 1, r, k);
            } break;
            case 'C': {
                F_set k;
                cin >> k.set, k.set_max = k.set;
                seg.apply(l - 1, r, k);
            } break;
        }
    }
}
```

{% endcontentbox %}

### 2.4 [HDU5306](https://acm.hdu.edu.cn/showproblem.php?pid=5306) 区间chkmin，查询区间和、最大值

> - `0 l r k` 令区间 `[l,r]` 内每个数`x`变为`min(x,k)`
> - `1 l r` 输出区间 `[l,r]` 中的最大值
> - `2 l r` 输出区间 `[l,r]` 的和

[题解](https://oi-wiki.org/ds/seg-beats/#hdu5306-gorgeous-sequence)：在`S`中维护区间和`sum`、最大值`max`、最大值个数`max_cnt`和严格次大值`snd_max`：

1. 当`chk_min`大于等于区间最大值`max`时，不需要执行操作
2. 当`chk_min`大于区间次大值`snd_max`时，令`sum -= (max - chk_min) * max_cnt;`
3. 当`chk_min`小于等于区间次大值`snd_max`时，由于不知道有多少个元素涉及到更新的问题，因此需要改为从线段树当前节点向下暴力递归更新，再回溯回来。这个步骤需要对模板中的`app_apply`方法进行修改。

{% contentbox "cpp &lt;atcoder/lazysegtree_modified&gt;" type:code %}

```cpp
#include <bits/stdc++.h>

#ifdef _MSC_VER
#include <intrin.h>
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
// clang-format off
template <class S,
          S (*op)(S, S),
          S (*e)(),
          class F,
          std::optional<S> (*mapping)(F, S),  //! <- S (*mapping)(F, S),
          F (*composition)(F, F),
          F (*id)()>
// clang-format on
struct lazy_segtree {
   public:
    lazy_segtree() : lazy_segtree(0) {}
    explicit lazy_segtree(int n) : lazy_segtree(std::vector<S>(n, e())) {}
    explicit lazy_segtree(const std::vector<S>& v) : _n(int(v.size())) {
        size = (int)internal::bit_ceil((unsigned int)(_n));
        log = internal::countr_zero((unsigned int)size);
        d = std::vector<S>(2 * size, e());
        lz = std::vector<F>(size, id());
        for (int i = 0; i < _n; i++) d[size + i] = v[i];
        for (int i = size - 1; i >= 1; i--) {
            update(i);
        }
    }

    S prod(int l, int r) {
        assert(0 <= l && l <= r && r <= _n);
        if (l == r) return e();

        l += size;
        r += size;

        for (int i = log; i >= 1; i--) {
            if (((l >> i) << i) != l) push(l >> i);
            if (((r >> i) << i) != r) push((r - 1) >> i);
        }

        S sml = e(), smr = e();
        while (l < r) {
            if (l & 1) sml = op(sml, d[l++]);
            if (r & 1) smr = op(d[--r], smr);
            l >>= 1;
            r >>= 1;
        }

        return op(sml, smr);
    }

    void apply(int l, int r, F f) {
        assert(0 <= l && l <= r && r <= _n);
        if (l == r) return;

        l += size;
        r += size;
        for (int i = log; i >= 1; i--) {
            if (((l >> i) << i) != l) push(l >> i);
            if (((r >> i) << i) != r) push((r - 1) >> i);
        }
        {
            int l2 = l, r2 = r;
            while (l < r) {
                if (l & 1) all_apply(l++, f);
                if (r & 1) all_apply(--r, f);
                l >>= 1;
                r >>= 1;
            }
            l = l2;
            r = r2;
        }

        for (int i = 1; i <= log; i++) {
            if (((l >> i) << i) != l) update(l >> i);
            if (((r >> i) << i) != r) update((r - 1) >> i);
        }
    }

   private:
    int _n, size, log;
    std::vector<S> d;
    std::vector<F> lz;

    void update(int k) { d[k] = op(d[2 * k], d[2 * k + 1]); }
    void all_apply(int k, F f) {
        if (k < size) lz[k] = composition(f, lz[k]);
        //! d[k] = mapping(f, d[k]);
        //! vvv
        if (auto new_value = mapping(f, d[k]); new_value) {
            d[k] = *new_value;
        } else {
            push(k);    // 向下暴搜
            update(k);  // 向上更新
        }
        //! ^^^
    }
    void push(int k) {
        all_apply(2 * k, lz[k]);
        all_apply(2 * k + 1, lz[k]);
        lz[k] = id();
    }
};

}  // namespace atcoder
```

{% endcontentbox %}

{% contentbox cpp type:code %}

```cpp
#include <bits/stdc++.h>

#include <atcoder/lazysegtree_modified>

using namespace std;
using ll = long long;
constexpr ll INF = 1e18, NEG_INF = -1e18;

// S: 幺半群内元素的定义
struct S {
    ll sum = 0;
    ll max = NEG_INF;
    int max_cnt = 0;
    ll snd_max = NEG_INF;
    friend istream& operator>>(istream& is, S& s) {
        is >> s.sum;
        s.max = s.sum;
        s.max_cnt = 1;
        s.snd_max = NEG_INF;
        return is;
    }
};
// op: 幺半群内元素的二元运算，需要满足结合律和封闭性
S op(S a, S b) {
    ll sum = a.sum + b.sum;
    ll max, snd_max;
    int max_cnt;
    if (a.max == b.max) {
        max = a.max;
        max_cnt = a.max_cnt + b.max_cnt;
        snd_max = std::max(a.snd_max, b.snd_max);
    } else if (a.max > b.max) {
        max = a.max;
        max_cnt = a.max_cnt;
        snd_max = std::max(a.snd_max, b.max);
    } else {
        max = b.max;
        max_cnt = b.max_cnt;
        snd_max = std::max(a.max, b.snd_max);
    }
    return {sum, max, max_cnt, snd_max};
}
// e: 单位元
constexpr S e() { return S{}; }
// F: 作用在幺半群上的函数的定义
struct F {
    ll chk_min = INF;
};
// mapping: 讲函数f作用在幺半群上元素S的函数，即mapping(f, x) = f(x)
optional<S> mapping(F f, S x) {
    if (x.max <= f.chk_min) return x;
    if (x.snd_max < f.chk_min) {
        x.sum -= (x.max - f.chk_min) * x.max_cnt;
        x.max = f.chk_min;
        return x;
    }
    // 无法确定需要更新的数的数目，需要向下暴力递归搜索，再向上更新回来
    return nullopt;
}
// composition: 函数f和g的复合函数，即composition(f, g) = f.g，(f.g)(x) = f(g(x))
F composition(F f, F g) { return F{min(f.chk_min, g.chk_min)}; }
// id: 函数的单位元，即mapping(id, x) = id(x) = x
F id() { return F{}; }

using segtree = atcoder::lazy_segtree<S, op, e, F, mapping, composition, id>;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int T;
    cin >> T;
    while (T--) {
        int N, M;
        cin >> N >> M;
        vector<S> a(N);
        for (auto& x : a) cin >> x;
        segtree seg(a);

        while (M--) {
            int op, l, r;
            cin >> op >> l >> r;
            switch (op) {
                case 0: {
                    F k;
                    cin >> k.chk_min;
                    seg.apply(l - 1, r, k);
                } break;
                case 1: { cout << seg.prod(l - 1, r).max << '\n'; } break;
                case 2: { cout << seg.prod(l - 1, r).sum << '\n'; } break;
            }
        }
    }
}
```

{% endcontentbox %}

### 2.5 [BZOJ4695](https://bzoj.net/p/4695) 区间加、chkmax、chkmin，查询区间和、最大值、最小值

> - `1 l r k` 令区间 `[l,r]` 内每个数`x`增加`k`
> - `2 l r k` 令区间 `[l,r]` 内每个数`x`变为`max(x,k)`
> - `3 l r k` 令区间 `[l,r]` 内每个数`x`变为`min(x,k)`
> - `4 l r` 输出区间 `[l,r]` 的和
> - `5 l r` 输出区间 `[l,r]` 的最大值
> - `6 l r` 输出区间 `[l,r]` 的最小值

[题解](https://oi-wiki.org/ds/seg-beats/#bzoj4695-%E6%9C%80%E5%81%87%E5%A5%B3%E9%80%89%E6%89%8B)：处理`chkmax`、`chkmin`的思路与上一题相同。规定`mapping`时先`add`再`min`和`max`。

{% contentbox cpp type:code %}

```cpp
#include <bits/stdc++.h>

#include <atcoder/lazysegtree_modified>

using namespace std;
using ll = long long;
constexpr int INF = numeric_limits<int>::max(), NEG_INF = numeric_limits<int>::min();

// S: 幺半群内元素的定义
struct S {
    ll sum = 0;
    int len = 0;
    int max = NEG_INF;
    int max_cnt = 0;
    int snd_max = NEG_INF;
    int min = INF;
    int min_cnt = 0;
    int snd_min = INF;
    void input() {
        cin >> sum, min = max = sum;
        len = min_cnt = max_cnt = 1;
        snd_max = NEG_INF, snd_min = INF;
    }
};
// op: 幺半群内元素的二元运算，需要满足结合律和封闭性
S op(S a, S b) {
    S res;
    res.sum = a.sum + b.sum;
    res.len = a.len + b.len;
    if (a.max == b.max) {
        res.max = a.max;
        res.max_cnt = a.max_cnt + b.max_cnt;
        res.snd_max = max(a.snd_max, b.snd_max);
    } else {
        auto&& [x, y] = minmax(a, b, [](const S& x, const S& y) { return x.max > y.max; });
        res.max = x.max;
        res.max_cnt = x.max_cnt;
        res.snd_max = max(x.snd_max, y.max);
    }
    if (a.min == b.min) {
        res.min = a.min;
        res.min_cnt = a.min_cnt + b.min_cnt;
        res.snd_min = min(a.snd_min, b.snd_min);
    } else {
        auto&& [x, y] = minmax(a, b, [](const S& x, const S& y) { return x.min < y.min; });
        res.min = x.min;
        res.min_cnt = x.min_cnt;
        res.snd_min = min(x.snd_min, y.min);
    }
    return res;
}
// e: 单位元
constexpr S e() { return S{}; }
// F: 作用在幺半群上的函数的定义
struct F {
    int add = 0;
    int upper_bound = INF;
    int lower_bound = NEG_INF;
};
// mapping: 讲函数f作用在幺半群上元素S的函数，即mapping(f, x) = f(x)
optional<S> mapping(F f, S x) {
    if (f.add) {
        x.sum += ll(f.add) * x.len;
        x.max += f.add;
        x.min += f.add;
        if (x.snd_max != NEG_INF) x.snd_max += f.add;
        if (x.snd_min != INF) x.snd_min += f.add;
    }
    // 无法确定需要更新的数的数目，需要向下暴力递归搜索，再向上更新回来
    if (f.upper_bound <= x.snd_max || f.lower_bound >= x.snd_min) return nullopt;
    if (f.upper_bound < x.max) {
        x.sum -= ll(x.max - f.upper_bound) * x.max_cnt;
        if (x.min == x.max) x.min = f.upper_bound;
        if (x.snd_min == x.max) x.snd_min = f.upper_bound;
        x.max = f.upper_bound;
    }
    if (f.lower_bound > x.min) {
        x.sum += ll(f.lower_bound - x.min) * x.min_cnt;
        if (x.max == x.min) x.max = f.lower_bound;
        if (x.snd_max == x.min) x.snd_max = f.lower_bound;
        x.min = f.lower_bound;
    }
    return x;
}
// composition: 函数f和g的复合函数，即composition(f, g) = f.g，(f.g)(x) = f(g(x))
F composition(F f, F g) {
    if (g.lower_bound != NEG_INF) g.lower_bound += f.add;
    if (g.upper_bound != INF) g.upper_bound += f.add;
    return F{
        .add = f.add + g.add,
        .upper_bound = min(f.upper_bound, max(f.lower_bound, g.upper_bound)),
        .lower_bound = max(f.lower_bound, min(f.upper_bound, g.lower_bound)),
    };
}
// id: 函数的单位元，即mapping(id, x) = id(x) = x
F id() { return F{}; }

using segtree = atcoder::lazy_segtree<S, op, e, F, mapping, composition, id>;

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, M;
    cin >> N;
    vector<S> a(N);
    for (auto& x : a) x.input();
    segtree seg(a);
    cin >> M;
    while (M--) {
        int op, l, r;
        cin >> op >> l >> r;
        F k;
        switch (op) {
            case 1: { cin >> k.add, seg.apply(l - 1, r, k); } break;
            case 2: { cin >> k.lower_bound, seg.apply(l - 1, r, k); } break;
            case 3: { cin >> k.upper_bound, seg.apply(l - 1, r, k); } break;
            case 4: { cout << seg.prod(l - 1, r).sum << '\n'; } break;
            case 5: { cout << seg.prod(l - 1, r).max << '\n'; } break;
            case 6: { cout << seg.prod(l - 1, r).min << '\n'; } break;
        }
    }
}
```

{% endcontentbox %}
