---
title: Splay树
date: 2023-12-26 23:09:40
tags:
  - 算法
  - 数据结构
  - 二叉搜索树 & 平衡树
  - Splay树
categories:
  - [算法, 数据结构, 二叉搜索树 & 平衡树]
---

# Splay树

> 参考：<https://oi-wiki.org/ds/splay>

## 1. 模板

{% contentbox "cpp &lt;splay_tree&gt;" type:code %}

```cpp
#include <bits/stdc++.h>

template <typename T, typename Comp = std::less<T>>
class splay_tree {
    using size_type = int;
    Comp comp_;

    struct node {
        node *children[2]{nullptr, nullptr}, *parent = nullptr;
        size_type size = 1;
        T key;
        node(auto&& key) : key(std::forward<decltype(key)>(key)) {}
        ~node() { delete children[0], delete children[1]; }
    };
    node* copy_node(node* x) {
        if (x == nullptr) return nullptr;
        node* ret = new node(x->key);
        ret->size = x->size;
        for (int i = 0; i < 2; ++i) {
            ret->children[i] = copy_node(x->children[i]);
            if (ret->children[i] != nullptr) ret->children[i]->parent = ret;
        }
        return ret;
    }
    node* root = nullptr;
    static void maintain_size(node* x) {
        x->size = 1;
        if (x->children[0] != nullptr) x->size += x->children[0]->size;
        if (x->children[1] != nullptr) x->size += x->children[1]->size;
    }
    static void rotate_up(node* x) {
        node *y = x->parent, *z = y->parent;
        int chk = x == y->children[1];
        y->children[chk] = x->children[chk ^ 1];
        if (x->children[chk ^ 1] != nullptr) x->children[chk ^ 1]->parent = y;
        x->children[chk ^ 1] = y;
        y->parent = x;
        x->parent = z;
        if (z != nullptr) z->children[y == z->children[1]] = x;
        maintain_size(y);
        maintain_size(x);
    }
    static node* splay(node* x) {
        for (node* f; (f = x->parent) != nullptr; rotate_up(x))
            if (f->parent != nullptr) rotate_up((x == f->children[1]) == (f == f->parent->children[1]) ? f : x);
        return x;
    }

   public:
    explicit splay_tree(Comp comp = Comp()) : comp_(comp){};
    ~splay_tree() { delete root; }
    splay_tree(splay_tree&& other) noexcept : comp_(std::move(other.comp_)), root(other.root) { other.root = nullptr; }
    splay_tree& operator=(splay_tree&& other) noexcept {
        delete root;
        comp_ = std::move(other.comp_);
        root = other.root;
        other.root = nullptr;
        return *this;
    }
    splay_tree(const splay_tree& other) : comp_(other.comp_) { root = copy_node(other.root); }
    splay_tree& operator=(const splay_tree& other) {
        delete root;
        comp_ = other.comp_;
        root = copy_node(other.root);
        return *this;
    }
    size_type size() const noexcept { return root == nullptr ? 0 : root->size; }
    bool empty() const noexcept { return root == nullptr; }
    const T& top() const {
        assert(!empty());
        return root->key;
    }
    size_type rank() const {
        assert(!empty());
        return root->children[0] == nullptr ? 0 : root->children[0]->size;
    }
    void insert(auto&& key) {
        if (empty()) {
            root = new node(std::forward<decltype(key)>(key));
            return;
        }
        node *x = root, *y = nullptr;
        while (x != nullptr) y = x, x = x->children[comp_(x->key, key)];
        x = new node(std::forward<decltype(key)>(key));
        x->parent = y;
        y->children[comp_(y->key, key)] = x;
        root = splay(x);
    }
    bool prev() {
        if (empty() || root->children[0] == nullptr) return false;
        node* x = root->children[0];
        while (x->children[1] != nullptr) x = x->children[1];
        root = splay(x);
        return true;
    }
    bool next() {
        if (empty() || root->children[1] == nullptr) return false;
        node* x = root->children[1];
        while (x->children[0] != nullptr) x = x->children[0];
        root = splay(x);
        return true;
    }
    bool upper_bound(auto&& key) {
        if (empty()) return false;
        node *x = root, *y = nullptr, *ret = nullptr;
        while (x != nullptr) {
            y = x;
            bool chk = comp_(key, x->key);
            if (chk) ret = x;
            x = x->children[!chk];
        }
        root = splay(ret == nullptr ? y : ret);
        return ret != nullptr;
    }
    bool lower_bound(auto&& key) {
        if (empty()) return false;
        node *x = root, *y = nullptr, *ret = nullptr;
        while (x != nullptr) {
            y = x;
            bool chk = comp_(x->key, key);
            if (!chk) ret = x;
            x = x->children[chk];
        }
        root = splay(ret == nullptr ? y : ret);
        return ret != nullptr;
    }
    bool at(size_type k) {
        if (size() <= k) return false;
        node* x = root;
        for (;;) {
            size_type left_size = x->children[0] == nullptr ? 0 : x->children[0]->size;
            if (left_size == k) {
                root = splay(x);
                return true;
            }
            if (left_size > k)
                x = x->children[0];
            else
                k -= left_size + 1, x = x->children[1];
        }
    }
    void pop() {
        assert(!empty());
        std::unique_ptr<node> old_root(root);
        root = nullptr;
        if (old_root->children[0] == nullptr && old_root->children[1] == nullptr) return;
        for (int k = 0; k < 2; ++k) {
            if (old_root->children[k ^ 1] == nullptr) {
                root = old_root->children[k];
                old_root->children[k] = nullptr;
                root->parent = nullptr;
                return;
            }
        }
        node *x = old_root->children[0], *y = old_root->children[1];
        old_root->children[0] = old_root->children[1] = nullptr;
        x->parent = y->parent = nullptr;
        while (x->children[1] != nullptr) x = x->children[1];
        root = splay(x);
        root->children[1] = y;
        root->size += y->size;
        y->parent = root;
    }
    splay_tree split_right() {
        assert(!empty());
        splay_tree ret;
        if (root->children[1] == nullptr) return ret;
        ret.root = root->children[1];
        root->children[1] = nullptr;
        ret.root->parent = nullptr;
        root->size -= ret.root->size;
        return ret;
    }
    splay_tree split_left() {
        assert(!empty());
        splay_tree ret;
        if (root->children[0] == nullptr) return ret;
        ret.root = root->children[0];
        root->children[0] = nullptr;
        ret.root->parent = nullptr;
        ret.root->size = root->size - ret.root->size;
        return ret;
    }
    void for_each(auto&& f) const {
        auto dfs = [&](auto&& dfs, node* x) -> void {
            if (x == nullptr) return;
            dfs(dfs, x->children[0]);
            f(x->key);
            dfs(dfs, x->children[1]);
        };
        dfs(dfs, root);
    }
    friend std::ostream& operator<<(std::ostream& os, const splay_tree& s) {
        size_type i = 0;
        s.for_each([&](auto&& key) { os << (i++ ? ", " : "[") << key; });
        if (!i) os << '[';
        return os << ']';
    }
};
```

{% endcontentbox %}

## 2. 例题

### 2.1 [LibreOJ #104](https://loj.ac/p/104) 普通平衡树

> 1. 插入 $x$ 数；
> 2. 删除 $x$ 数（若有多个相同的数，只删除一个）；
> 3. 查询 $x$ 数的排名（若有多个相同的数，输出最小的排名）；
> 4. 查询排名为 $x$ 的数；
> 5. 求 $x$ 的前驱（前驱定义为小于 $x$ ，且最大的数）；
> 6. 求 $x$ 的后继（后继定义为大于 $x$ ，且最小的数）。

{% contentbox "cpp" type:code %}

```cpp
#include <bits/stdc++.h>
#include <splay_tree>
using namespace std;
using splay = splay_tree<int>;
int main() {
    ios::sync_with_stdio(false), cin.tie(0);
    int N, op, x;
    cin >> N;
    splay s;
    while (N--) {
        cin >> op >> x;
        switch (op) {
            case 1: {
                s.insert(x);
            } break;
            case 2: {
                s.lower_bound(x);
                s.pop();
            } break;
            case 3: {
                s.lower_bound(x);
                cout << s.rank() + 1 << '\n';
            } break;
            case 4: {
                s.at(x - 1);
                cout << s.top() << '\n';
            } break;
            case 5: {
                s.lower_bound(x);
                if (s.top() >= x) s.prev();
                cout << s.top() << '\n';
            } break;
            case 6: {
                s.upper_bound(x);
                cout << s.top() << '\n';
            } break;
        }
    }
}
```

{% endcontentbox %}
