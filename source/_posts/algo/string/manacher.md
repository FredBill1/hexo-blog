---
title: Manacher
date: 2025-01-06 19:40:20
tags:
  - 算法
  - 字符串
  - Manacher
  - 回文串
categories:
  - [算法, 字符串]
---

# Manacher

> 参考：<https://oi-wiki.org/string/manacher>

{% contentbox "cpp" type:code %}

```cpp
std::pair<std::string, std::vector<int>> manacher(const std::string_view S) {
    std::string s = "^|";
    s.reserve(S.size() * 2 + 3);
    for (auto c : S) s.push_back(c), s.push_back('|');
    s.push_back('$');
    std::vector<int> p(s.size());  //  p[i] is the radius of the longest palindrome centered at i
    for (int r = 0, mid = 0, i = 1; i < int(s.size()) - 1; ++i) {
        p[i] = r >= i ? std::min(p[mid * 2 - i], r - i) : 1;
        while (s[i - p[i]] == s[i + p[i]]) ++p[i];
        if (i + p[i] - 1 > r) r = i + p[i] - 1, mid = i;
    }
    return {std::move(s), std::move(p)};
}

std::string longest_palindromic_substring(const std::string_view S) {
    auto [s, p] = manacher(S);
    int mid = std::max_element(p.begin() + 2, p.end() - 2) - p.begin();
    std::string res(p[mid] - 1, '\0');
    for (int i = mid - p[mid] + 2, j = 0; i < mid + p[mid]; i += 2) res[j++] = s[i];
    return res;
}
```

{% endcontentbox %}

{% contentbox "python" type:code %}

```python
def manacher(s: str) -> tuple[str, list[int]]:
    s = "^|" + "|".join(s) + "|$"
    p = [0] * len(s)  # p[i] is the radius of the longest palindrome centered at i
    r = mid = 0
    for i in range(1, len(s) - 1):
        p[i] = min(p[mid * 2 - i], r - i) if r >= i else 1
        while s[i - p[i]] == s[i + p[i]]:
            p[i] += 1
        if i + p[i] - 1 > r:
            r = i + p[i] - 1
            mid = i
    return s, p


def longest_palindromic_substring(s: str) -> str:
    s, p = manacher(s)
    mid = p.index(max(p))
    return s[mid - p[mid] + 2 : mid + p[mid] : 2]
```

{% endcontentbox %}
