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

{% contentbox "python kmp.py" type:code %}

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

{% contentbox "cpp kmp.cpp" type:code %}

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<int> get_p(const string_view s) {
    vector<int> p(s.size());
    int l = 0;
    for (int r = 1; r < int(s.size()); ++r) {
        while (l > 0 && s[l] != s[r]) l = p[l - 1];
        if (s[l] == s[r]) ++l;
        p[r] = l;
    }
    return p;
}

int kmp(const string_view text, const string_view pattern) {
    auto p = get_p(pattern);
    int l = 0;
    for (int r = 0; r < int(text.size()); ++r) {
        while (l > 0 && pattern[l] != text[r]) l = p[l - 1];
        if (pattern[l] == text[r]) ++l;
        if (l == int(pattern.size())) return r - l + 1;
    }
    return -1;
}

vector<int> kmp_all(const string_view text, const string_view pattern) {
    auto p = get_p(pattern);
    vector<int> pos;
    int l = 0;
    for (int r = 0; r < int(text.size()); ++r) {
        while (l > 0 && pattern[l] != text[r]) l = p[l - 1];
        if (pattern[l] == text[r]) ++l;
        if (l == int(pattern.size())) {
            pos.push_back(r - l + 1);
            l = p[l - 1];
        }
    }
    return pos;
}
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

{% contentbox "cpp ac_automation.cpp" type:code %}

```cpp
#include <bits/stdc++.h>
using namespace std;

constexpr int CHAR_SIZE = 26;
constexpr int CHAR_START = 'a';

struct TrieNode {
    TrieNode* ch[CHAR_SIZE]{};
    vector<int> idxes;
    int visit_cnt = 0;
    TrieNode* fail = nullptr;
    int in_degree = 0;
};

vector<int> ac_automation(const vector<string>& patterns, const string& text) {
    vector<unique_ptr<TrieNode>> nodes;
    auto new_node = [&]() { return nodes.emplace_back(make_unique<TrieNode>()).get(); };
    TrieNode* const root = new_node();

    // build trie
    for (int idx = 0; idx < int(patterns.size()); ++idx) {
        TrieNode* cur = nodes.front().get();
        for (auto c : patterns[idx]) {
            int i = c - CHAR_START;
            if (!cur->ch[i]) cur->ch[i] = new_node();
            cur = cur->ch[i];
        }
        cur->idxes.push_back(idx);
    }

    // build fail pointer
    root->fail = root;
    queue<TrieNode*> q;
    for (int i = 0; i < CHAR_SIZE; ++i) {
        if (root->ch[i]) {
            root->ch[i]->fail = root;
            q.push(root->ch[i]);
        } else {
            root->ch[i] = root;
        }
    }
    while (!q.empty()) {
        TrieNode* cur = q.front();
        q.pop();
        for (int i = 0; i < CHAR_SIZE; ++i) {
            if (cur->ch[i] == nullptr) {
                cur->ch[i] = cur->fail->ch[i];
            } else {
                cur->ch[i]->fail = cur->fail->ch[i];
                ++cur->fail->ch[i]->in_degree;
                q.push(cur->ch[i]);
            }
        }
    }

    // search
    TrieNode* cur = root;
    for (auto c : text) {
        int i = c - CHAR_START;
        cur = cur->ch[i];
        ++cur->visit_cnt;
    }

    // count occurrences with topological sort
    vector<int> occurrences(patterns.size());
    for (auto& x : nodes)
        if (x->in_degree == 0) q.push(x.get());
    while (!q.empty()) {
        TrieNode* cur = q.front();
        q.pop();
        for (int idx : cur->idxes) occurrences[idx] += cur->visit_cnt;
        cur->fail->visit_cnt += cur->visit_cnt;
        if (--cur->fail->in_degree == 0) q.push(cur->fail);
    }

    return occurrences;
}

int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N;
    cin >> N;
    vector<string> patterns(N);
    for (auto& s : patterns) cin >> s;
    string text;
    cin >> text;
    auto occurrences = ac_automation(patterns, text);
    cout << count_if(occurrences.begin(), occurrences.end(), [](int x) { return x > 0; });
}
```

{% endcontentbox %}
