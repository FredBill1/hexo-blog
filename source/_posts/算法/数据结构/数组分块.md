---
title: 数组分块
date: 2025-01-29 00:57:53
tags:
  - 算法
  - 数据结构
  - 分块
  - 区间众数
categories:
  - [算法, 数据结构]
---

# 数组分块

## [洛谷P4168 [Violet] 蒲公英](https://www.luogu.com.cn/problem/P4168) 区间众数

> 参考：<https://www.cnblogs.com/acfunction/p/10051345.html>

{% contentbox cpp type:code %}

```cpp
#include <bits/stdc++.h>
class RangeMode {
    const int M;
    std::vector<std::vector<int>> cnts;
    std::vector<std::vector<std::pair<int, int>>> modes;
    std::vector<int> a;
    std::vector<int> discrete;
    std::vector<int> tmp_cnt;

   public:
    RangeMode(std::vector<int>&& arr) : M(std::sqrt(arr.size())), a(std::move(arr)) {
        const int N = a.size();
        const int K = (N + M - 1) / M;
        discrete = a;
        std::sort(discrete.begin(), discrete.end());
        discrete.erase(std::unique(discrete.begin(), discrete.end()), discrete.end());
        for (auto& x : a) x = std::lower_bound(discrete.begin(), discrete.end(), x) - discrete.begin();
        const int L = discrete.size();
        cnts.resize(K, std::vector<int>(L));
        for (int i = 0; i < N; ++i) ++cnts[i / M][a[i]];
        modes.resize(K);
        tmp_cnt.resize(L);
        for (int i = 0; i < K; ++i) {
            modes[i].resize(i + 1);
            auto it = std::max_element(cnts[i].begin(), cnts[i].end());
            modes[i][i] = {int(it - cnts[i].begin()), *it};
            if (i > 0)
                for (int k = 0; k < L; ++k) cnts[i][k] += cnts[i - 1][k];
            for (int j = i - 1; j >= 0; --j) {
                modes[i][j] = modes[i][j + 1];
                for (int k = j * M; k < (j + 1) * M; ++k) {
                    int cur = cnts[i][a[k]] - (j ? cnts[j - 1][a[k]] : 0);
                    if (cur > modes[i][j].second || (cur == modes[i][j].second && a[k] < modes[i][j].first))
                        modes[i][j] = {a[k], cur};
                }
            }
        }
    }

    std::pair<int, int> query(int left, int right) {  // [left, right) -> {value, count}
        int L = left / M, R = --right / M;
        auto ans = (L + 1 >= R) ? std::make_pair(0, 0) : modes[R - 1][L + 1];
        if (L + 1 >= R) {
            for (int i = left; i <= right; ++i) {
                int cur = ++tmp_cnt[a[i]];
                if (cur > ans.second || (cur == ans.second && a[i] < ans.first)) ans = {a[i], tmp_cnt[a[i]]};
            }
            for (int i = left; i <= right; ++i) tmp_cnt[a[i]] = 0;
        } else {
            auto process = [&](int i) {
                if (!tmp_cnt[a[i]]) tmp_cnt[a[i]] = cnts[R - 1][a[i]] - cnts[L][a[i]];
                int cur = ++tmp_cnt[a[i]];
                if (cur > ans.second || (cur == ans.second && a[i] < ans.first)) ans = {a[i], tmp_cnt[a[i]]};
            };
            for (int i = left; i < (L + 1) * M; ++i) process(i);
            for (int i = R * M; i <= right; ++i) process(i);
            for (int i = left; i < (L + 1) * M; ++i) tmp_cnt[a[i]] = 0;
            for (int i = R * M; i <= right; ++i) tmp_cnt[a[i]] = 0;
        }
        return {discrete[ans.first], ans.second};
    }
};

using namespace std;
int main() {
    ios::sync_with_stdio(0), cin.tie(0);
    int N, M;
    cin >> N >> M;
    vector<int> a(N);
    for (auto& x : a) cin >> x;
    RangeMode rm(std::move(a));
    int x = 0;
    while (M--) {
        int l0, r0;
        cin >> l0 >> r0;
        int l = (l0 + x - 1) % N, r = (r0 + x - 1) % N;
        if (l > r) swap(l, r);
        x = rm.query(l, r + 1).first;
        cout << x << '\n';
    }
}
```

{% endcontentbox %}
