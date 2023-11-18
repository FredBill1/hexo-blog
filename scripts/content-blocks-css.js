hexo.extend.filter.register('theme_inject', function (injects) {
    const content_blocks_css = hexo.extend.helper.get('content_blocks_css').bind(hexo);
    injects.head.raw('content-blocks-css',
        `<style type="text/css">${content_blocks_css()}</style>`
    );
});