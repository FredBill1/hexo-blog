---
title: 一些数论模板
date: 2024-01-10 13:10:05
tags:
  - 算法
  - 数学
  - 数论
  - 快速幂
  - gcd
  - lcm
  - exgcd
  - excrt
  - 线性同余方程
  - 逆元
  - Miller-Rabin素性测试
  - 组合数
  - Lucas定理
  - 欧拉筛(线性素数筛)
  - 质因数分解
categories:
  - [算法, 数学, 数论]
---

# 一些数论模板

> 参考：
> 
> - <https://oi-wiki.org/math/number-theory/basic/>
> - <https://github.com/atcoder/ac-library>

## 1. 模板

{% contentbox "cpp &lt;number_theory&gt;" type:code %}

```cpp
#include <bits/stdc++.h>
namespace my {
using ll = long long;
constexpr ll safe_mod(ll x, ll m) {
    x %= m;
    if (x < 0) x += m;
    return x;
}
#if ((defined(_MSVC_LANG) && _MSVC_LANG >= 201703L) || __cplusplus >= 201703L)
using std::gcd, std::lcm;
#else
constexpr ll gcd(ll a, ll b) {
    while (b) a %= b, std::swap(a, b);
    return a;
}
constexpr ll lcm(ll a, ll b) { return a / gcd(a, b) * b; }
#endif
constexpr ll pow_mod(ll base, ll exp, ll m) {
    ll res = 1, x = safe_mod(base, m);
    while (exp) {
        if (exp & 1) res = res * x % m;
        x = x * x % m, exp >>= 1;
    }
    return res;
}
// only to be used when overflow might occur
constexpr ll mul_mod(ll a, ll b, ll m) {
    ll r = 0;
    a = safe_mod(a, m), b = safe_mod(b, m);
    while (b) {
        if (b & 1) r = (r + a) % m;
        a = (a << 1) % m, b >>= 1;
    }
    return r;
}
// @param n `0 <= n`
constexpr bool is_prime(int n) {  // Miller–Rabin
    if (n <= 1) return false;
    if (n == 2 || n == 7 || n == 61) return true;
    if (n % 2 == 0) return false;
    ll d = n - 1;
    while (d % 2 == 0) d /= 2;
    constexpr ll bases[3] = {2, 7, 61};
    for (ll a : bases) {
        ll t = d, y = pow_mod(a, t, n);
        while (t != n - 1 && y != 1 && y != n - 1) y = y * y % n, t <<= 1;
        if (y != n - 1 && t % 2 == 0) return false;
    }
    return true;
}
// @param b `1 <= b`
// @return pair(g, x) s.t. g = gcd(a, m), ax = g (mod m), 0 <= x < m/g
constexpr std::pair<ll, ll> inv_gcd(ll a, ll m) {
    a = safe_mod(a, m);
    if (a == 0) return {m, 0};
    ll s = m, t = a;
    ll m0 = 0, m1 = 1;
    while (t) {
        ll u = s / t;
        s -= t * u, m0 -= m1 * u;
        std::swap(s, t), std::swap(m0, m1);
    }
    if (m0 < 0) m0 += m / s;
    return {s, m0};
}
constexpr ll inv_prime(ll x, ll m_prime) { return pow_mod(x, m_prime - 2, m_prime); }
std::optional<ll> inv(ll x, ll m) {
    auto res = inv_gcd(x, m);
    if (res.first != 1) return std::nullopt;
    return res.second;
}
// return ax + by = gcd(a, b), |x|<=b, |y|<=a
ll exgcd(ll a, ll b, ll& x, ll& y) {
    ll x1 = 1, x2 = 0, x3 = 0, x4 = 1;
    while (b != 0) {
        ll c = a / b;
        std::tie(x1, x2, x3, x4, a, b) = std::make_tuple(x3, x4, x1 - x3 * c, x2 - x4 * c, b, a - b * c);
    }
    x = x1, y = x2;
    return a;
}
std::optional<ll> inv2(ll a, ll m) {  // same as inv
    ll x, y;
    ll d = exgcd(a, m, x, y);
    if (d == 1) return (x + m) % m;
    return std::nullopt;
}
// x = r[i] (mod m[i]) for all i
// return (rem, Mod) where x = rem (mod Mod)
// return nullopt if impossible, return (0, 1) if rem = 0
std::optional<std::pair<ll, ll>> excrt(const std::vector<ll>& r, const std::vector<ll>& m) {
    assert(r.size() == m.size());
    int n = int(r.size());
    ll r0 = 0, m0 = 1;
    for (int i = 0; i < n; i++) {
        assert(1 <= m[i]);
        ll r1 = safe_mod(r[i], m[i]), m1 = m[i];
        if (m0 < m1) std::swap(r0, r1), std::swap(m0, m1);
        if (m0 % m1 == 0) {
            if (r0 % m1 != r1) return std::nullopt;
            continue;
        }
        ll g, im;
        std::tie(g, im) = inv_gcd(m0, m1);
        ll u1 = (m1 / g);
        if ((r1 - r0) % g) return std::nullopt;
        ll x = (r1 - r0) / g % u1 * im % u1;
        r0 += x * m0;
        m0 *= u1;
        if (r0 < 0) r0 += m0;
    }
    return std::make_pair(r0, m0);
}
std::vector<ll> linear_inv(int N, ll m) {
    std::vector<ll> invs(N + 1);
    invs[1] = 1;
    for (int i = 2; i <= N; ++i) invs[i] = (m - m / i) * invs[m % i] % m;
    return invs;
}
std::vector<ll> linear_inv(const std::vector<ll>& a, ll m_prime) {
    int N = int(a.size());
    std::vector<ll> s(N), sv(N);
    s[0] = 1;
    for (int i = 0; i < N - 1; ++i) s[i + 1] = s[i] * a[i] % m_prime;
    sv.back() = inv_prime(s.back() * a.back() % m_prime, m_prime);
    for (int i = N - 1; i > 0; --i) sv[i - 1] = sv[i] * a[i] % m_prime;
    for (int i = 0; i < N; ++i) s[i] = s[i] * sv[i] % m_prime;
    return s;
}
struct Comb {
    int N;
    std::vector<ll> inv, fac, ifac;
    ll m;
    Comb() = default;
    Comb(const Comb&) = default;
    Comb(Comb&&) = default;
    Comb& operator=(const Comb&) = default;
    Comb& operator=(Comb&&) = default;
    Comb(int N, ll m) : N(N), m(m) {
        inv = linear_inv(N, m);
        fac.resize(N + 1), ifac.resize(N + 1);
        fac[0] = ifac[0] = 1;
        for (int i = 1; i <= N; ++i) {
            fac[i] = fac[i - 1] * i % m;
            ifac[i] = ifac[i - 1] * inv[i] % m;
        }
    }
    // select k from n
    ll operator()(int n, int k) const {
        assert(n <= N);
        if (n < 0 || k < 0 || n < k) return 0;
        return fac[n] * ifac[k] % m * ifac[n - k] % m;
    }
};
ll comb(ll n, ll k, ll m_prime) {
    if (n < 0 || k < 0 || n < k) return 0;
    ll res = 1;
    for (ll i = 1; i <= k; ++i) res = res * (n - i + 1) % m_prime * inv_prime(i, m_prime) % m_prime;
    return res;
}
ll lucas(ll n, ll k, ll m_prime) {
    if (n < 0 || k < 0 || n < k) return 0;
    if (n < m_prime && k < m_prime) return comb(n, k, m_prime);
    return comb(n % m_prime, k % m_prime, m_prime) * lucas(n / m_prime, k / m_prime, m_prime) % m_prime;
}
ll lucas(ll n, ll k, ll m_prime, const Comb& comb) {
    assert(comb.m == m_prime);
    if (n < 0 || k < 0 || n < k) return 0;
    if (n < m_prime && k < m_prime) return comb(n, k);
    return comb(n % m_prime, k % m_prime) * lucas(n / m_prime, k / m_prime, m_prime, comb) % m_prime;
}
struct Prime {
    std::vector<bool> is_prime;
    std::vector<int> primes;
    Prime() = default;
    Prime(const Prime&) = default;
    Prime(Prime&&) = default;
    Prime& operator=(const Prime&) = default;
    Prime& operator=(Prime&&) = default;
    Prime(int N) : is_prime(N + 1, true) {
        is_prime[0] = is_prime[1] = false;
        for (int i = 2; i <= N; ++i) {
            if (is_prime[i]) primes.push_back(i);
            for (auto prime : primes) {
                if (i * prime > N) break;
                is_prime[i * prime] = false;
                if (i % prime == 0) break;
            }
        }
    }
};
std::vector<int> breakdown(int N) {
    std::vector<int> result;
    for (int i = 2; i * i <= N; i++) {
        if (N % i == 0) {
            while (N % i == 0) N /= i;
            result.push_back(i);
        }
    }
    if (N != 1) result.push_back(N);
    return result;
}
std::vector<int> breakdown(int N, const Prime& prime) {
    std::vector<int> result;
    for (auto p : prime.primes) {
        if (p * p > N) break;
        if (N % p == 0) {
            while (N % p == 0) N /= p;
            result.push_back(p);
        }
    }
    if (N != 1) result.push_back(N);
    return result;
}
}  // namespace my
```

{% endcontentbox %}
