---
title: KMP和AC自动机
date: 2025-01-05 14:23:55
tags:
  - 算法
  - 字符串
  - KMP
  - AC 自动机
categories:
  - [算法, 字符串]
---

# KMP

> 参考：<https://oi-wiki.org/string/kmp>

{% contentbox "python KMP.py" type:code %}

```python
def get_p(s: str) -> list[int]:
    p = [0] * len(s)
    l = 0
    for r in range(1, len(s)):
        while l > 0 and s[l] != s[r]:
            l = p[l - 1]
        if s[l] == s[r]:
            l += 1
        p[r] = l
    return p


def kmp(s: str, t: str) -> int:
    p = get_p(t)
    l = 0
    for r in range(len(s)):
        while l > 0 and t[l] != s[r]:
            l = p[l - 1]
        if t[l] == s[r]:
            l += 1
        if l == len(t):
            return r - len(t) + 1
    return -1


def kmp_all(s: str, t: str) -> list[int]:
    p = get_p(t)
    res = []
    l = 0
    for r in range(len(s)):
        while l > 0 and t[l] != s[r]:
            l = p[l - 1]
        if t[l] == s[r]:
            l += 1
        if l == len(t):
            res.append(r - len(t) + 1)
            l = p[l - 1]
    return res
```

{% endcontentbox %}

# AC 自动机

> 参考：<https://oi-wiki.org/string/ac-automaton>

[洛谷P5357 【模板】AC 自动机](https://www.luogu.com.cn/problem/P5357)

{% contentbox "python ac_automation.py" type:code %}

```python
import sys
from collections import deque
from typing import Optional


class TrieNode:
    def __init__(self):
        self.ch: list[Optional["TrieNode"]] = [None] * 26
        self.idxes: list[int] = []
        self.visit_cnt: int = 0
        self.fail: Optional["TrieNode"] = None
        self.in_degree: int = 0

    __slots__ = "ch", "idxes", "visit_cnt", "fail", "in_degree"


def ac_automation(patterns: list[str], text: str) -> list[int]:
    root = TrieNode()
    nodes: list[TrieNode] = [root]

    # build trie
    for idx, pattern in enumerate(patterns):
        cur = root
        for c in pattern:
            i = ord(c) - ord("a")
            if cur.ch[i] is None:
                nodes.append(TrieNode())
                cur.ch[i] = nodes[-1]
            cur = cur.ch[i]
        cur.idxes.append(idx)

    # build fail pointer
    root.fail = root
    q = deque(x for x in root.ch if x is not None)
    for x in q:
        x.fail = root
    root.ch = [x if x is not None else root for x in root.ch]
    while q:
        cur = q.popleft()
        for i in range(26):
            if cur.ch[i] is None:
                cur.ch[i] = cur.fail.ch[i]
            else:
                cur.ch[i].fail = cur.fail.ch[i]
                cur.fail.ch[i].in_degree += 1
                q.append(cur.ch[i])

    # search
    cur = root
    for c in text:
        i = ord(c) - ord("a")
        cur = cur.ch[i]
        cur.visit_cnt += 1

    # count occurrences with topological sort
    occurrences = [0] * len(patterns)
    q = deque(x for x in nodes if not x.in_degree)
    while q:
        cur = q.popleft()
        for idx in cur.idxes:
            occurrences[idx] = cur.visit_cnt
        cur.fail.visit_cnt += cur.visit_cnt
        cur.fail.in_degree -= 1
        if not cur.fail.in_degree:
            q.append(cur.fail)

    return occurrences


input = lambda: sys.stdin.readline().rstrip("\r\n")

N = int(input())
patterns = [input() for _ in range(N)]
text = input()
print(*ac_automation(patterns, text), sep="\n")
```

{% endcontentbox %}
