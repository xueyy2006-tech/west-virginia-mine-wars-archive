# 矿战史料馆 · Mine Wars Archive 1912–1922

西弗吉尼亚矿战本地史料网站，包含地图、年表、史料检索及研究书目。

## 在线访问

https://xueyy2006-tech.github.io/west-virginia-mine-wars-archive/

公开静态网站通过 GitHub Pages 托管。大型 PDF 全文通过同一仓库的 Release 下载；
其余文本原件和中译在网站内打开。PDF 下载后需手动定位所引页码。

## 下载与使用

1. 下载本仓库，或使用 `git clone`。
2. 从本仓库 **Releases → v1.0.0** 下载全部 `library-part-*.zip`。
3. 把每个 ZIP 解压到仓库根目录，合并为同一个 `library/` 文件夹。
4. 双击 `index.html`，或运行 `python -m http.server 8822` 后访问 `http://localhost:8822`。

大型史料保存在 Release 附件中，而不是 Git 历史中。仓库与全部附件合起来才是完整网站。
`file-manifest.json` 记录上线改动前的原始网站文件 SHA256；原始本地文件未修改。
`deployment-manifest.json` 记录上线版本的文件 SHA256。原始网页备份保存在 Git 提交 `3182655`。
排除了仅供构建的 `_build/` 目录，不包含其他论文工作目录或登录信息。

## 注意

经所有者确认，本仓库、Release 附件及 GitHub Pages 网站均公开。各项史料的权利归原权利人所有；
本次备份不授予新增的再分发许可。史料的考辨与限度见 `说明.md`。

## English

A local West Virginia Mine Wars archive with maps, chronology, source search and bibliography.
Download all `library-part-*.zip` assets from release v1.0.0 and extract them into the repository root.
Open `index.html`. The repository and release assets together form the complete site.

## 日本語

ウェストバージニア鉱山戦争の史料サイトです。Release v1.0.0 のすべての
`library-part-*.zip` をリポジトリ直下に展開し、`index.html` を開いてください。
