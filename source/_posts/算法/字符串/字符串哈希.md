---
title: 字符串哈希
date: 2025-01-05 23:19:08
tags:
  - 算法
  - 字符串
  - 字符串哈希
categories:
  - [算法, 字符串]
---

# 字符串哈希

> 参考：<https://oi-wiki.org/string/hash>

## 1. 哈希函数定义

$$
\begin{align}
\text{hash}(n) & = \sum_{i=1}^{n} s_i \times B^{N-i} \mod M \\
               & = \text{hash}(n-1) \times B + s_n \mod M   \\
               & = (s_1 \times B^{N-1} + s_2 \times B^{N-2} + \cdots + s_N) \mod M
\end{align}
$$

$$
\text{hash}(l, r) = \text{hash}(r) - \text{hash}(l-1) \times B^{r-l+1} \mod M
$$

$$
B = 131, M \in \{998244353, 1000000007\}
$$

## 2. 例题

### 1. [leetcode28 Find the Index of the First Occurrence in a String](https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string)

{% contentbox "python" type:code %}

```python
class StrHash:
    MODS = [998244353, 1000000007]

    class Hasher:
        BASE = 131

        def __init__(self, s: str, m: int) -> None:
            self.m = m
            N = len(s)
            self.p = [1] * (N + 1)
            for i in range(1, N + 1):
                self.p[i] = self.p[i - 1] * self.BASE % m
            self.a = [0] * (N + 1)
            for i, c in enumerate(s, 1):
                self.a[i] = (self.a[i - 1] * self.BASE + ord(c)) % m

        def query(self, l: int, r: int) -> int:
            return (self.a[r] - self.a[l - 1] * self.p[r - l + 1] % self.m + self.m) % self.m

    def __init__(self, s: str) -> None:
        self.hashers = tuple(self.Hasher(s, m) for m in self.MODS)

    def query(self, l: int, r: int) -> tuple[int, ...]:
        "[l, r)"
        return tuple(h.query(l + 1, r) for h in self.hashers)


class Solution:
    def strStr(self, haystack: str, needle: str) -> int:
        N, M = len(haystack), len(needle)
        target = StrHash(needle).query(0, M)
        h = StrHash(haystack)
        for i in range(N - M + 1):
            if h.query(i, i + M) == target:
                return i
        return -1
```

{% endcontentbox %}

### 2. [CF1200E Compress Words](https://codeforces.com/contest/1200/problem/E)

- `I want to order pizza` $\rightarrow$ `Iwantorderpizza`
- `sample please ease in out` $\rightarrow$ `sampleaseinout`

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
using namespace std;
using ull = unsigned long long;
constexpr ull B = 131;
constexpr ull MODS[2]{998244353, 1000000007};

void solve() {
    int N;
    cin >> N;
    vector<string> a(N);
    for (auto& s : a) cin >> s;

    string cur;
    for (const auto& s : a) {
        ull hashes_cur[2]{};
        ull hashes_s[2]{};
        ull powers[2]{1, 1};
        int overlap = 0;

        for (int i = 0; i < min(s.size(), cur.size()); ++i) {
            ull cur_c = cur[cur.size() - 1 - i];
            ull s_c = s[i];

            for (int j = 0; j < 2; j++) {
                hashes_cur[j] = (hashes_cur[j] + powers[j] * cur_c % MODS[j]) % MODS[j];
                powers[j] = (powers[j] * B) % MODS[j];
                hashes_s[j] = (hashes_s[j] * B % MODS[j] + s_c) % MODS[j];
            }
            if (hashes_cur[0] == hashes_s[0] && hashes_cur[1] == hashes_s[1]) overlap = i + 1;
        }
        cur.append(s.begin() + overlap, s.end());
    }

    cout << cur;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
}
```

{% endcontentbox %}
