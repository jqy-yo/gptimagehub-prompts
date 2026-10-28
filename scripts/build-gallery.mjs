import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";

const rows = (await readFile(new URL("../data/prompts.jsonl", import.meta.url), "utf8")).trim().split("\n").map(JSON.parse);
const { examples } = JSON.parse(await readFile(new URL("../data/generated-examples.json", import.meta.url), "utf8"));
const labels = {
  "portrait-photography": "Portrait & Photography · 人像摄影",
  "poster-illustration": "Poster & Illustration · 海报插画",
  "ui-ux-design": "UI / UX Design · 界面设计",
  "logo-branding": "Logo & Branding · 品牌设计",
  "product-ecommerce": "Product & E-commerce · 商品电商",
  "character-design": "Character Design · 角色设计",
  "game-asset": "Game Assets · 游戏素材",
  "social-media": "Social Media · 社交媒体",
  infographic: "Infographics · 信息图",
  cinematic: "Cinematic · 电影感画面",
  "3d-render": "3D Render · 三维渲染",
  "anime-manga": "Anime & Manga · 动漫",
  "concept-art": "Concept Art · 概念艺术",
  other: "Other · 其他",
};
const html = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const url = value => {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:") throw new Error(`Unexpected URL: ${value}`);
  return html(parsed.href);
};
const image = (entry, generated) => generated ? entry.image_url : entry.example_image_urls[0] ?? entry.cover_image_url;
function card(entry, generated = false) {
  const preview = image(entry, generated);
  const kind = generated || entry.example_image_urls.length ? "Generated example · 新生成示例" : "Source cover · 原始封面";
  return `<td width="33%" valign="top" align="center"><a href="${url(entry.canonical_url)}"><img src="${url(preview)}" width="260" alt="${html(entry.title)}"></a><br><strong><a href="${url(entry.canonical_url)}">${html(entry.title)}</a></strong><br><sub>${kind}</sub><br><sub>Template: <a href="${url(entry.source_url ?? entry.canonical_url)}">${html(entry.source_author || "GPT Image Hub")}</a></sub><br><a href="${url(entry.canonical_url)}">View / use prompt · 查看模板</a></td>`;
}
function grid(entries, generated = false) {
  const result = ["<table>"];
  for (let i = 0; i < entries.length; i += 3) result.push("<tr>", ...entries.slice(i, i + 3).map(entry => card(entry, generated)), "</tr>");
  return [...result, "</table>"].join("\n");
}
const groups = Object.entries(labels).map(([slug, title]) => ({ slug, title, rows: rows.filter(row => row.category === slug) })).filter(group => group.rows.length);
const categories = groups.map(group => `| [${group.title}](${group.slug}.md) | ${group.rows.length} |`).join("\n");
await mkdir(new URL("../gallery/", import.meta.url), { recursive: true });
for (const group of groups) {
  await writeFile(new URL(`../gallery/${group.slug}.md`, import.meta.url), `# ${group.title}\n\n[All categories · 全部分类](README.md) · [Website · 官网](https://www.gptimagehub.com/)\n\n${group.rows.length} templates with previews. Click an image or title to read and use the complete prompt.\n\n图片来自模板原封面或标注的新生成示例。点击图片可打开对应模板，保留作者与原帖链接。\n\n${grid(group.rows)}\n\nPrompt text: CC BY 4.0 with per-record attribution. Linked images have separate rights; this repository does not relicense them. Generated examples illustrate composition and style, not a verified output model.\n`);
}
await writeFile(new URL("../gallery/README.md", import.meta.url), `# Browse ${rows.length} illustrated prompts · 图文模板目录\n\n[Back to project · 项目首页](../README.md) · [Browse on the website · 官网图库](https://www.gptimagehub.com/) · [20 generated examples · 新生成示例](generated-examples.md)\n\nEvery text record has a preview image and a link to its full template. Images are loaded from the public CDN; original template attribution is preserved.\n\n| Category · 分类 | Templates · 数量 |\n|---|---:|\n${categories}\n`);
await writeFile(new URL("../gallery/generated-examples.md", import.meta.url), `# 20 generated examples · 新生成示例\n\n[Back to project · 项目首页](../README.md) · [${rows.length} illustrated templates · 图文模板目录](README.md)\n\nCreated for GPT Image Hub with the built-in image tool. These examples illustrate composition and style; the tool does not disclose its underlying model identifier. Template authors and original posts are linked under each image.\n\n这 20 张由本站使用内置工具重新生成，覆盖 13 个分类，点击图片可查看对应模板。其中 6 条模板属于本仓库的 ${rows.length} 条许可明确的文本数据；其余仅展示图片和官网链接，未在数据集中追加许可不明的提示词正文。\n\n${grid(examples, true)}\n\nLinked images are external previews with separate rights. They are not original-author images or proof that a particular model produced these results.\n`);
const featuredSlugs = ["agi2-100-luxury-miniature-dubai-city-model", "agi2-35-anime-campers-in-a-winter-tent", "agi2-76-stormy-tropical-city-with-rooftop-plane", "agi2p-27-portrait-photography-musician-leaving-bodega-night-cinematic-portrait", "agi2-112-luxury-amber-perfume-ad", "agi2-26-handwritten-realistic-letter"];
const featured = featuredSlugs.map(slug => rows.find(row => row.slug === slug));
if (featured.some(row => !row)) throw new Error("Featured prompt missing from the dataset");
// The open-source collection (data/open-source, written by the import pipeline's export-repo.mjs) has its own galleries.
const ossDir = new URL("../data/open-source/", import.meta.url);
const ossRows = (await Promise.all((await readdir(ossDir)).filter(name => name.endsWith(".jsonl")).sort()
  .map(async name => (await readFile(new URL(name, ossDir), "utf8")).trim().split("\n").map(JSON.parse)))).flat();
const ossFeaturedSlugs = ["dramatic-japanese-butadon-food-poster", "banana-robot-toy-product-shot", "retro-footage-of-japanese-suburb", "future-software-engineers-in-2050", "wuxia-mmorpg-gameplay-screenshot", "anime-girl-in-spring-tatami-room"];
const ossFeatured = ossFeaturedSlugs.map(slug => ossRows.find(row => row.slug === slug));
if (ossFeatured.some(row => !row)) throw new Error("Featured open-source prompt missing from data/open-source");
const collectionName = value => new URL(value).pathname.slice(1);
const total = rows.length + ossRows.length;

// One README per language, each with a switcher line at the top; English is README.md so GitHub shows it by default.
// site: the website's locale prefix for that language, null when the site has no such locale (links go to English).
const README_LANGUAGES = [
  { code: "en", file: "README.md", name: "English", site: "" },
  { code: "zh-CN", file: "README.zh-CN.md", name: "简体中文", site: "zh-CN" },
  { code: "ja", file: "README.ja.md", name: "日本語", site: "ja" },
  { code: "hi", file: "README.hi.md", name: "हिन्दी", site: "hi" },
  { code: "bn", file: "README.bn.md", name: "বাংলা", site: null },
  { code: "de", file: "README.de.md", name: "Deutsch", site: "de" },
  { code: "ko", file: "README.ko.md", name: "한국어", site: "ko" },
  { code: "vi", file: "README.vi.md", name: "Tiếng Việt", site: "vi" },
];
// Category names per README language, in README_LANGUAGES order.
const CATEGORY_NAMES = {
  "portrait-photography": ["Portrait & Photography", "人像摄影", "ポートレート・写真", "पोर्ट्रेट और फ़ोटोग्राफ़ी", "পোর্ট্রেট ও ফটোগ্রাফি", "Porträt & Fotografie", "인물·사진", "Chân dung & Nhiếp ảnh"],
  "poster-illustration": ["Poster & Illustration", "海报插画", "ポスター・イラスト", "पोस्टर और इलस्ट्रेशन", "পোস্টার ও ইলাস্ট্রেশন", "Poster & Illustration", "포스터·일러스트", "Poster & Minh họa"],
  "ui-ux-design": ["UI / UX Design", "界面设计", "UI / UX デザイン", "UI / UX डिज़ाइन", "UI / UX ডিজাইন", "UI-/UX-Design", "UI / UX 디자인", "Thiết kế UI / UX"],
  "logo-branding": ["Logo & Branding", "品牌设计", "ロゴ・ブランディング", "लोगो और ब्रांडिंग", "লোগো ও ব্র্যান্ডিং", "Logo & Branding", "로고·브랜딩", "Logo & Thương hiệu"],
  "product-ecommerce": ["Product & E-commerce", "商品电商", "商品・EC", "प्रोडक्ट और ई-कॉमर्स", "পণ্য ও ই-কমার্স", "Produkt & E-Commerce", "상품·이커머스", "Sản phẩm & Thương mại điện tử"],
  "character-design": ["Character Design", "角色设计", "キャラクターデザイン", "कैरेक्टर डिज़ाइन", "ক্যারেক্টার ডিজাইন", "Charakterdesign", "캐릭터 디자인", "Thiết kế nhân vật"],
  "game-asset": ["Game Assets", "游戏素材", "ゲーム素材", "गेम एसेट", "গেম অ্যাসেট", "Spiel-Assets", "게임 에셋", "Tài nguyên game"],
  "social-media": ["Social Media", "社交媒体", "SNS", "सोशल मीडिया", "সোশ্যাল মিডিয়া", "Social Media", "소셜 미디어", "Mạng xã hội"],
  infographic: ["Infographics", "信息图", "インフォグラフィック", "इन्फ़ोग्राफ़िक", "ইনফোগ্রাফিক", "Infografiken", "인포그래픽", "Infographic"],
  cinematic: ["Cinematic", "电影感画面", "シネマティック", "सिनेमैटिक", "সিনেমাটিক", "Filmisch", "시네마틱", "Điện ảnh"],
  "3d-render": ["3D Render", "三维渲染", "3D レンダー", "3D रेंडर", "3D রেন্ডার", "3D-Rendering", "3D 렌더", "Render 3D"],
  "anime-manga": ["Anime & Manga", "动漫", "アニメ・マンガ", "एनीमे और मांगा", "অ্যানিমে ও মাঙ্গা", "Anime & Manga", "애니메·만화", "Anime & Manga"],
  "concept-art": ["Concept Art", "概念艺术", "コンセプトアート", "कॉन्सेप्ट आर्ट", "কনসেপ্ট আর্ট", "Concept Art", "콘셉트 아트", "Concept art"],
  other: ["Other", "其他", "その他", "अन्य", "অন্যান্য", "Sonstiges", "기타", "Khác"],
};
const TEXT = {
  en: {
    tagline: n => `**${n} image prompt templates with previews.** Complete prompts in English, Japanese and Chinese; titles, descriptions and tags in 18 languages. Browse by category, copy a template, or generate it on the website.`,
    site: "Open GPT Image Hub", browse: "Browse by category", data: "Data and licenses",
    featured: "Featured", featuredNote: "Every image opens the template on the website. The first six covers were generated by GPT Image Hub from the open-source collection's prompts; the last three are generated examples for the attributed snapshot.",
    ossCover: "Cover generated by GPT Image Hub", basedOn: (c, l) => `Based on ${c} (${l})`, generated: "Generated example", template: "Template", view: "View and use the prompt",
    tableCategory: "Category", tableCount: "Templates", tableGalleries: "Galleries", ossGallery: "Open-source collection", ownGallery: "Attributed snapshot",
    galleryNote: "Each gallery shows a sample with previews; every record is in the data files below and on the website.",
    dataset: "Dataset", records: "Records", license: "License", files: "Files", ossName: "Open-source collection", ownName: "Attributed snapshot", perRecord: "MIT or CC BY 4.0, per record",
    ossAbout: "Templates based on MIT and CC BY 4.0 GitHub collections, rewritten and reorganized in English with Japanese and Chinese versions, given new titles, descriptions, tags and 18-language translations, and illustrated with newly generated covers. Files are split by category",
    ownAbout: n => `${n} CC BY 4.0 records with the original author and post kept per record, captured 2026-10-21. Also on`,
    fields: "Fields", fileList: "file list", cdn: "Image URLs point to the public CDN, so cloning the repository does not download image binaries. Model hints describe templates, not a verified output model.",
    more: "More", methodology: "Live dataset methodology", api: "API documentation",
    attribution: "Attribution and license",
    attributionIntro: "Each record keeps the license of its source. Linked images and third-party names have separate rights and are not relicensed. No endorsement is implied.",
    ossNotices: "upstream notices in [LICENSES/](LICENSES/), changes described in [data/open-source/README.md](data/open-source/README.md)",
    ownAdapted: "adapted from", recordsWord: "records",
    ownTerms: "Original authors and source URLs are retained per record. GPT Image Hub contributes organization, corrections, export metadata and newly generated illustrative previews. Reuse of the prompt text requires attribution and indication of changes under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Newly generated previews are not original-author works.",
    contact: "To correct a template, fix attribution or ask for removal, send the slug and the original source in an [issue](https://github.com/jqy-yo/gptimagehub-prompts/issues) or through the [website contact page](https://www.gptimagehub.com/about).",
    mcp: "MCP access",
    mcpIntro: "Official MCP Registry: [`io.github.jqy-yo/gptimagehub`, v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0). Search prompts, retrieve full templates and list categories without an API key using Streamable HTTP:",
    mcpNote: "Generation requires a separate authenticated workflow and credits. Public discovery does not grant generation access.",
    review: "Help review translations",
    reviewText: "Native speakers of Japanese, Korean, German, French, Spanish, and Brazilian Portuguese can review the proposed copy in [translation-review](translation-review). The drafts have received AI review and automated checks; native-speaker sign-off is still pending. See [CONTRIBUTING.md](CONTRIBUTING.md).",
    rebuild: "Rebuild galleries",
    rebuildText: "Run `node scripts/build-gallery.mjs` after updating either dataset or the generated example index. It renders the attributed snapshot's galleries and these READMEs from the data files; the open-source galleries come from the import pipeline. It only renders Markdown and does not call an image generation service.",
  },
  "zh-CN": {
    tagline: n => `**${n} 个带配图的图像提示词模板。** 完整提示词有英文、日文、中文三个版本，标题、描述和标签覆盖 18 种语言。按分类看图，复制模板直接用，也可以在官网一键生成。`,
    site: "打开 GPT Image Hub 官网", browse: "按分类浏览", data: "数据与许可",
    featured: "精选", featuredNote: "点击图片即可在官网打开对应模板。前 6 张封面由 GPT Image Hub 根据开源合集的提示词生成，后 3 张是署名快照的新生成示例。",
    ossCover: "本站生成的封面", basedOn: (c, l) => `来源：${c}（${l}）`, generated: "新生成示例", template: "模板作者", view: "查看并使用模板",
    tableCategory: "分类", tableCount: "模板数", tableGalleries: "图集", ossGallery: "开源合集", ownGallery: "署名快照",
    galleryNote: "每个图集展示一部分带预览图的模板，全部记录都在下方的数据文件和官网中。",
    dataset: "数据集", records: "条数", license: "许可", files: "文件", ossName: "开源合集", ownName: "署名快照", perRecord: "MIT 或 CC BY 4.0（按每条记录）",
    ossAbout: "基于 MIT 和 CC BY 4.0 许可的 GitHub 开源合集：提示词用英文重新编写整理，并配有日文和中文版本；标题、描述、标签为本站重写，翻译成 18 种语言；每条都重新生成了封面。文件按分类拆分",
    ownAbout: n => `${n} 条 CC BY 4.0 记录，每条保留原作者和原帖链接，快照日期 2026-10-21。同时发布在`,
    fields: "字段", fileList: "文件列表", cdn: "图片链接指向公开 CDN，克隆仓库不会下载图片文件。模型提示只说明模板面向的模型，不代表已验证的出图模型。",
    more: "更多", methodology: "数据集说明", api: "API 文档",
    attribution: "署名与许可",
    attributionIntro: "每条记录沿用其来源的许可。链接的图片和第三方名称另有权利，不在本仓库的许可范围内，也不代表任何背书。",
    ossNotices: "上游许可与版权声明见 [LICENSES/](LICENSES/)，修改说明见 [data/open-source/README.md](data/open-source/README.md)",
    ownAdapted: "改编自", recordsWord: "条",
    ownTerms: "每条记录保留原作者和来源链接。GPT Image Hub 负责整理、更正、导出元数据并新生成示例图。再次使用提示词文本时，需要按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 署名并注明修改。新生成的示例图不是原作者作品。",
    contact: "如需更正模板、署名或下架，请附上 slug 和原始来源，[提交 issue](https://github.com/jqy-yo/gptimagehub-prompts/issues) 或通过 [官网联系方式](https://www.gptimagehub.com/about) 联系维护者。",
    mcp: "MCP 接入",
    mcpIntro: "已收录于官方 MCP Registry：[`io.github.jqy-yo/gptimagehub`，v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0)。无需 API key，通过 Streamable HTTP 即可搜索提示词、获取完整模板和分类列表：",
    mcpNote: "生成图片需要单独登录授权并消耗积分；公开检索不包含生成权限。",
    review: "参与翻译审校",
    reviewText: "欢迎日语、韩语、德语、法语、西班牙语和巴西葡萄牙语母语者审校 [translation-review](translation-review) 中的译文。这些译稿已经过 AI 审校和自动检查，还缺母语者确认。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。",
    rebuild: "重新生成图集",
    rebuildText: "更新任一数据集或生成示例索引后，运行 `node scripts/build-gallery.mjs`。它会根据数据文件生成署名快照的图集和这几份 README；开源合集的图集由导入流程生成。脚本只生成 Markdown，不会调用生图服务。",
  },
  ja: {
    tagline: n => `**プレビュー付きの画像プロンプトテンプレート ${n} 件。** 完全なプロンプトは英語・日本語・中国語の 3 言語、タイトル・説明・タグは 18 言語に対応。カテゴリから探してテンプレートをコピーするか、サイト上でそのまま生成できます。`,
    site: "GPT Image Hub を開く", browse: "カテゴリ別に見る", data: "データとライセンス",
    featured: "ピックアップ", featuredNote: "画像をクリックするとサイト上のテンプレートが開きます。最初の 6 枚はオープンソースコレクションのプロンプトから GPT Image Hub が生成したカバー、残りの 3 枚は帰属付きスナップショット用に新しく生成した作例です。",
    ossCover: "GPT Image Hub で生成したカバー", basedOn: (c, l) => `出典：${c}（${l}）`, generated: "新規生成の作例", template: "テンプレート作者", view: "プロンプトを見て使う",
    tableCategory: "カテゴリ", tableCount: "テンプレート数", tableGalleries: "ギャラリー", ossGallery: "オープンソースコレクション", ownGallery: "帰属付きスナップショット",
    galleryNote: "各ギャラリーではプレビュー付きの一部を紹介しています。すべてのレコードは下記のデータファイルとサイトにあります。",
    dataset: "データセット", records: "件数", license: "ライセンス", files: "ファイル", ossName: "オープンソースコレクション", ownName: "帰属付きスナップショット", perRecord: "MIT または CC BY 4.0（レコードごと）",
    ossAbout: "MIT / CC BY 4.0 ライセンスの GitHub コレクションをもとにしたテンプレート。プロンプトは英語で書き直して整理し、日本語版と中国語版を付けています。タイトル・説明・タグは新たに作成して 18 言語に翻訳し、カバー画像はすべて新しく生成しました。ファイルはカテゴリごとに分かれています",
    ownAbout: n => `原作者と元の投稿をレコードごとに残した CC BY 4.0 のレコード ${n} 件（2026-10-21 時点）。こちらでも公開しています：`,
    fields: "フィールド", fileList: "ファイル一覧", cdn: "画像 URL は公開 CDN を指しているため、リポジトリをクローンしても画像ファイルはダウンロードされません。モデルのヒントはテンプレートの想定モデルであり、出力を検証したモデルではありません。",
    more: "その他", methodology: "データセットの方法論", api: "API ドキュメント",
    attribution: "クレジットとライセンス",
    attributionIntro: "各レコードは出典のライセンスを引き継ぎます。リンク先の画像や第三者の名称には別の権利があり、このデータセットで再ライセンスされることはありません。推奨・提携を意味するものではありません。",
    ossNotices: "上流のライセンス表示は [LICENSES/](LICENSES/)、変更点は [data/open-source/README.md](data/open-source/README.md) を参照",
    ownAdapted: "以下をもとに作成", recordsWord: "件",
    ownTerms: "原作者と出典 URL はレコードごとに残しています。GPT Image Hub は整理、修正、エクスポート用メタデータ、新規生成の作例を加えています。プロンプト本文を再利用する場合は [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) に従ってクレジットと変更点を明記してください。新規生成の作例は原作者の作品ではありません。",
    contact: "テンプレートの修正、クレジットの訂正、削除のご依頼は、slug と元の出典を添えて [issue](https://github.com/jqy-yo/gptimagehub-prompts/issues) または [サイトのお問い合わせ](https://www.gptimagehub.com/about) からご連絡ください。",
    mcp: "MCP での利用",
    mcpIntro: "公式 MCP Registry に登録済み：[`io.github.jqy-yo/gptimagehub`、v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0)。API キー不要で、Streamable HTTP からプロンプト検索、テンプレート全文の取得、カテゴリ一覧の取得ができます：",
    mcpNote: "画像の生成には別途認証とクレジットが必要です。公開の検索機能に生成の権限は含まれません。",
    review: "翻訳レビューのお願い",
    reviewText: "日本語・韓国語・ドイツ語・フランス語・スペイン語・ブラジルポルトガル語のネイティブの方に、[translation-review](translation-review) の訳文のレビューをお願いしています。AI によるレビューと自動チェックは済んでいますが、ネイティブの確認がまだです。詳しくは [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。",
    rebuild: "ギャラリーの再生成",
    rebuildText: "どちらかのデータセットや作例インデックスを更新したら `node scripts/build-gallery.mjs` を実行してください。データファイルから帰属付きスナップショットのギャラリーとこれらの README を生成します。オープンソースコレクションのギャラリーはインポート処理で作られます。Markdown を出力するだけで、画像生成サービスは呼び出しません。",
  },
  hi: {
    tagline: n => `**प्रीव्यू के साथ ${n} इमेज प्रॉम्प्ट टेम्पलेट।** पूरे प्रॉम्प्ट अंग्रेज़ी, जापानी और चीनी में; शीर्षक, विवरण और टैग 18 भाषाओं में। श्रेणी के अनुसार देखें, टेम्पलेट कॉपी करें, या वेबसाइट पर सीधे इमेज बनाएँ।`,
    site: "GPT Image Hub खोलें", browse: "श्रेणी के अनुसार देखें", data: "डेटा और लाइसेंस",
    featured: "चुनिंदा", featuredNote: "किसी भी इमेज पर क्लिक करके वेबसाइट पर उसका टेम्पलेट खोलें। पहले छह कवर GPT Image Hub ने ओपन-सोर्स संग्रह के प्रॉम्प्ट से बनाए हैं; आख़िरी तीन एट्रिब्यूटेड स्नैपशॉट के लिए नए बनाए गए उदाहरण हैं।",
    ossCover: "GPT Image Hub द्वारा बनाया गया कवर", basedOn: (c, l) => `स्रोत: ${c} (${l})`, generated: "नया बनाया गया उदाहरण", template: "टेम्पलेट लेखक", view: "प्रॉम्प्ट देखें और इस्तेमाल करें",
    tableCategory: "श्रेणी", tableCount: "टेम्पलेट", tableGalleries: "गैलरी", ossGallery: "ओपन-सोर्स संग्रह", ownGallery: "एट्रिब्यूटेड स्नैपशॉट",
    galleryNote: "हर गैलरी में प्रीव्यू के साथ कुछ नमूने हैं; सभी रिकॉर्ड नीचे दी गई डेटा फ़ाइलों और वेबसाइट पर उपलब्ध हैं।",
    dataset: "डेटासेट", records: "रिकॉर्ड", license: "लाइसेंस", files: "फ़ाइलें", ossName: "ओपन-सोर्स संग्रह", ownName: "एट्रिब्यूटेड स्नैपशॉट", perRecord: "हर रिकॉर्ड के अनुसार MIT या CC BY 4.0",
    ossAbout: "MIT और CC BY 4.0 लाइसेंस वाले GitHub संग्रहों पर आधारित टेम्पलेट: प्रॉम्प्ट अंग्रेज़ी में दोबारा लिखे और व्यवस्थित किए गए हैं, साथ में जापानी और चीनी संस्करण हैं; नए शीर्षक, विवरण और टैग 18 भाषाओं में अनुवादित हैं; और हर रिकॉर्ड के लिए नया कवर बनाया गया है। फ़ाइलें श्रेणी के अनुसार बँटी हैं",
    ownAbout: n => `${n} CC BY 4.0 रिकॉर्ड, हर रिकॉर्ड में मूल लेखक और मूल पोस्ट सुरक्षित; स्नैपशॉट 2026-10-21 का है। यह यहाँ भी उपलब्ध है:`,
    fields: "फ़ील्ड", fileList: "फ़ाइल सूची", cdn: "इमेज URL सार्वजनिक CDN की ओर इशारा करते हैं, इसलिए रिपॉज़िटरी क्लोन करने पर इमेज फ़ाइलें डाउनलोड नहीं होतीं। मॉडल संकेत बताता है कि टेम्पलेट किस मॉडल के लिए लिखा गया है; यह जाँचा हुआ आउटपुट मॉडल नहीं है।",
    more: "और", methodology: "डेटासेट की कार्यप्रणाली", api: "API दस्तावेज़",
    attribution: "श्रेय और लाइसेंस",
    attributionIntro: "हर रिकॉर्ड अपने स्रोत का लाइसेंस बनाए रखता है। लिंक की गई इमेज और तृतीय-पक्ष नामों के अधिकार अलग हैं और इस डेटासेट के तहत दोबारा लाइसेंस नहीं किए जाते। इसका अर्थ किसी प्रकार का समर्थन नहीं है।",
    ossNotices: "मूल लाइसेंस सूचनाएँ [LICENSES/](LICENSES/) में, बदलावों का विवरण [data/open-source/README.md](data/open-source/README.md) में",
    ownAdapted: "इन स्रोतों से रूपांतरित", recordsWord: "रिकॉर्ड",
    ownTerms: "हर रिकॉर्ड में मूल लेखक और स्रोत URL सुरक्षित हैं। GPT Image Hub ने संयोजन, सुधार, एक्सपोर्ट मेटाडेटा और नई उदाहरण इमेज जोड़ी हैं। प्रॉम्प्ट टेक्स्ट दोबारा इस्तेमाल करने पर [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) के अनुसार श्रेय देना और बदलाव बताना ज़रूरी है। नए बनाए गए उदाहरण मूल लेखकों की कृति नहीं हैं।",
    contact: "किसी टेम्पलेट में सुधार, श्रेय ठीक करने या उसे हटाने के लिए slug और मूल स्रोत के साथ [issue](https://github.com/jqy-yo/gptimagehub-prompts/issues) खोलें या [वेबसाइट के संपर्क पेज](https://www.gptimagehub.com/about) से संपर्क करें।",
    mcp: "MCP एक्सेस",
    mcpIntro: "आधिकारिक MCP Registry में उपलब्ध: [`io.github.jqy-yo/gptimagehub`, v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0)। बिना API key के Streamable HTTP से प्रॉम्प्ट खोजें, पूरे टेम्पलेट लें और श्रेणियों की सूची देखें:",
    mcpNote: "इमेज बनाने के लिए अलग से लॉगिन और क्रेडिट चाहिए। सार्वजनिक खोज में इमेज बनाने की अनुमति शामिल नहीं है।",
    review: "अनुवाद की समीक्षा में मदद करें",
    reviewText: "जापानी, कोरियाई, जर्मन, फ़्रेंच, स्पेनिश और ब्राज़ीलियाई पुर्तगाली के मूल भाषी [translation-review](translation-review) में प्रस्तावित अनुवाद की समीक्षा कर सकते हैं। ड्राफ़्ट की AI समीक्षा और स्वचालित जाँच हो चुकी है; मूल भाषी की पुष्टि अभी बाकी है। देखें [CONTRIBUTING.md](CONTRIBUTING.md)।",
    rebuild: "गैलरी दोबारा बनाना",
    rebuildText: "किसी भी डेटासेट या उदाहरण सूची को अपडेट करने के बाद `node scripts/build-gallery.mjs` चलाएँ। यह डेटा फ़ाइलों से एट्रिब्यूटेड स्नैपशॉट की गैलरी और ये README बनाता है; ओपन-सोर्स संग्रह की गैलरी इम्पोर्ट प्रक्रिया से बनती हैं। यह केवल Markdown बनाता है और कोई इमेज जनरेशन सेवा नहीं बुलाता।",
  },
  bn: {
    tagline: n => `**প্রিভিউসহ ${n}টি ইমেজ প্রম্পট টেমপ্লেট।** সম্পূর্ণ প্রম্পট ইংরেজি, জাপানি ও চীনা ভাষায়; শিরোনাম, বিবরণ ও ট্যাগ 18টি ভাষায়। বিভাগ অনুযায়ী দেখুন, টেমপ্লেট কপি করুন, অথবা ওয়েবসাইটেই সরাসরি ছবি তৈরি করুন।`,
    site: "GPT Image Hub খুলুন", browse: "বিভাগ অনুযায়ী দেখুন", data: "ডেটা ও লাইসেন্স",
    featured: "নির্বাচিত", featuredNote: "যেকোনো ছবিতে ক্লিক করলে ওয়েবসাইটে সেই টেমপ্লেট খুলবে। প্রথম ছয়টি কভার ওপেন-সোর্স সংগ্রহের প্রম্পট থেকে GPT Image Hub তৈরি করেছে; শেষ তিনটি অ্যাট্রিবিউটেড স্ন্যাপশটের জন্য নতুন তৈরি উদাহরণ।",
    ossCover: "GPT Image Hub-এর তৈরি কভার", basedOn: (c, l) => `উৎস: ${c} (${l})`, generated: "নতুন তৈরি উদাহরণ", template: "টেমপ্লেট লেখক", view: "প্রম্পট দেখুন ও ব্যবহার করুন",
    tableCategory: "বিভাগ", tableCount: "টেমপ্লেট", tableGalleries: "গ্যালারি", ossGallery: "ওপেন-সোর্স সংগ্রহ", ownGallery: "অ্যাট্রিবিউটেড স্ন্যাপশট",
    galleryNote: "প্রতিটি গ্যালারিতে প্রিভিউসহ কিছু নমুনা দেখানো হয়েছে; সব রেকর্ড নিচের ডেটা ফাইলে ও ওয়েবসাইটে আছে।",
    dataset: "ডেটাসেট", records: "রেকর্ড", license: "লাইসেন্স", files: "ফাইল", ossName: "ওপেন-সোর্স সংগ্রহ", ownName: "অ্যাট্রিবিউটেড স্ন্যাপশট", perRecord: "প্রতিটি রেকর্ড অনুযায়ী MIT বা CC BY 4.0",
    ossAbout: "MIT ও CC BY 4.0 লাইসেন্সের GitHub সংগ্রহের ভিত্তিতে তৈরি টেমপ্লেট: প্রম্পটগুলো ইংরেজিতে নতুন করে লেখা ও সাজানো হয়েছে, সঙ্গে জাপানি ও চীনা সংস্করণ আছে; নতুন শিরোনাম, বিবরণ ও ট্যাগ 18টি ভাষায় অনূদিত; এবং প্রতিটি রেকর্ডের জন্য নতুন কভার তৈরি করা হয়েছে। ফাইলগুলো বিভাগ অনুযায়ী ভাগ করা",
    ownAbout: n => `${n}টি CC BY 4.0 রেকর্ড, প্রতিটিতে মূল লেখক ও মূল পোস্ট রাখা আছে; স্ন্যাপশটের তারিখ 2026-10-21। এটি এখানেও পাওয়া যায়:`,
    fields: "ফিল্ড", fileList: "ফাইলের তালিকা", cdn: "ছবির URL পাবলিক CDN-এর দিকে নির্দেশ করে, তাই রিপোজিটরি ক্লোন করলে ছবির ফাইল ডাউনলোড হয় না। মডেলের ইঙ্গিত শুধু বোঝায় টেমপ্লেটটি কোন মডেলের জন্য লেখা; এটি যাচাই করা আউটপুট মডেল নয়।",
    more: "আরও", methodology: "ডেটাসেটের পদ্ধতি", api: "API ডকুমেন্টেশন",
    attribution: "কৃতিত্ব ও লাইসেন্স",
    attributionIntro: "প্রতিটি রেকর্ড তার উৎসের লাইসেন্স বজায় রাখে। লিঙ্ক করা ছবি ও তৃতীয় পক্ষের নামের অধিকার আলাদা; এই ডেটাসেটের অধীনে সেগুলো পুনরায় লাইসেন্স করা হয় না। এটি কোনো ধরনের অনুমোদন বোঝায় না।",
    ossNotices: "মূল লাইসেন্স বিজ্ঞপ্তি [LICENSES/](LICENSES/)-এ, পরিবর্তনের বিবরণ [data/open-source/README.md](data/open-source/README.md)-এ",
    ownAdapted: "এগুলো থেকে রূপান্তরিত", recordsWord: "রেকর্ড",
    ownTerms: "প্রতিটি রেকর্ডে মূল লেখক ও উৎসের URL রাখা আছে। GPT Image Hub সংকলন, সংশোধন, এক্সপোর্ট মেটাডেটা ও নতুন উদাহরণ ছবি যোগ করেছে। প্রম্পট টেক্সট পুনরায় ব্যবহার করলে [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) অনুযায়ী কৃতিত্ব দিতে ও পরিবর্তন উল্লেখ করতে হবে। নতুন তৈরি উদাহরণগুলো মূল লেখকদের কাজ নয়।",
    contact: "কোনো টেমপ্লেট সংশোধন, কৃতিত্ব ঠিক করা বা সরানোর জন্য slug ও মূল উৎসসহ একটি [issue](https://github.com/jqy-yo/gptimagehub-prompts/issues) খুলুন অথবা [ওয়েবসাইটের যোগাযোগ পাতা](https://www.gptimagehub.com/about) থেকে যোগাযোগ করুন।",
    mcp: "MCP অ্যাক্সেস",
    mcpIntro: "অফিশিয়াল MCP Registry-তে তালিকাভুক্ত: [`io.github.jqy-yo/gptimagehub`, v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0)। API key ছাড়াই Streamable HTTP দিয়ে প্রম্পট খুঁজুন, সম্পূর্ণ টেমপ্লেট নিন ও বিভাগের তালিকা দেখুন:",
    mcpNote: "ছবি তৈরির জন্য আলাদা লগইন ও ক্রেডিট লাগে। পাবলিক অনুসন্ধানে ছবি তৈরির অনুমতি অন্তর্ভুক্ত নয়।",
    review: "অনুবাদ পর্যালোচনায় সাহায্য করুন",
    reviewText: "জাপানি, কোরিয়ান, জার্মান, ফরাসি, স্প্যানিশ ও ব্রাজিলীয় পর্তুগিজ ভাষার মাতৃভাষীরা [translation-review](translation-review)-এ প্রস্তাবিত অনুবাদ পর্যালোচনা করতে পারেন। খসড়াগুলো AI পর্যালোচনা ও স্বয়ংক্রিয় যাচাই পেরিয়েছে; মাতৃভাষীর অনুমোদন এখনও বাকি। দেখুন [CONTRIBUTING.md](CONTRIBUTING.md)।",
    rebuild: "গ্যালারি পুনরায় তৈরি",
    rebuildText: "কোনো ডেটাসেট বা উদাহরণ সূচি আপডেট করার পর `node scripts/build-gallery.mjs` চালান। এটি ডেটা ফাইল থেকে অ্যাট্রিবিউটেড স্ন্যাপশটের গ্যালারি ও এই README-গুলো তৈরি করে; ওপেন-সোর্স সংগ্রহের গ্যালারি ইমপোর্ট প্রক্রিয়া থেকে আসে। এটি শুধু Markdown তৈরি করে, কোনো ছবি তৈরির সেবা ডাকে না।",
  },
  de: {
    tagline: n => `**${n} Bild-Prompt-Vorlagen mit Vorschau.** Vollständige Prompts auf Englisch, Japanisch und Chinesisch; Titel, Beschreibungen und Tags in 18 Sprachen. Nach Kategorie stöbern, Vorlage kopieren oder direkt auf der Website generieren.`,
    site: "GPT Image Hub öffnen", browse: "Nach Kategorie stöbern", data: "Daten und Lizenzen",
    featured: "Auswahl", featuredNote: "Jedes Bild öffnet die Vorlage auf der Website. Die ersten sechs Cover hat GPT Image Hub aus den Prompts der Open-Source-Sammlung generiert; die letzten drei sind neu generierte Beispiele für den Snapshot mit Quellenangabe.",
    ossCover: "Cover von GPT Image Hub generiert", basedOn: (c, l) => `Grundlage: ${c} (${l})`, generated: "Neu generiertes Beispiel", template: "Vorlage", view: "Prompt ansehen und verwenden",
    tableCategory: "Kategorie", tableCount: "Vorlagen", tableGalleries: "Galerien", ossGallery: "Open-Source-Sammlung", ownGallery: "Snapshot mit Quellenangabe",
    galleryNote: "Jede Galerie zeigt eine Auswahl mit Vorschau; alle Einträge stehen in den Datendateien unten und auf der Website.",
    dataset: "Datensatz", records: "Einträge", license: "Lizenz", files: "Dateien", ossName: "Open-Source-Sammlung", ownName: "Snapshot mit Quellenangabe", perRecord: "MIT oder CC BY 4.0, je Eintrag",
    ossAbout: "Vorlagen auf Basis von GitHub-Sammlungen unter MIT und CC BY 4.0: Die Prompts wurden auf Englisch neu geschrieben und gegliedert, mit japanischer und chinesischer Fassung; neue Titel, Beschreibungen und Tags gibt es in 18 Sprachen; jedes Cover wurde neu generiert. Die Dateien sind nach Kategorien aufgeteilt",
    ownAbout: n => `${n} Einträge unter CC BY 4.0, jeweils mit ursprünglichem Autor und Originalbeitrag, Stand 2026-10-21. Auch verfügbar auf`,
    fields: "Felder", fileList: "Dateiliste", cdn: "Bild-URLs verweisen auf das öffentliche CDN; beim Klonen des Repositorys werden keine Bilddateien heruntergeladen. Modellhinweise beschreiben, wofür eine Vorlage gedacht ist, kein verifiziertes Ausgabemodell.",
    more: "Mehr", methodology: "Methodik des Datensatzes", api: "API-Dokumentation",
    attribution: "Quellenangabe und Lizenz",
    attributionIntro: "Jeder Eintrag behält die Lizenz seiner Quelle. Verlinkte Bilder und Namen Dritter unterliegen eigenen Rechten und werden nicht neu lizenziert. Eine Billigung ist damit nicht verbunden.",
    ossNotices: "Lizenzhinweise der Quellen in [LICENSES/](LICENSES/), Änderungen in [data/open-source/README.md](data/open-source/README.md)",
    ownAdapted: "bearbeitet nach", recordsWord: "Einträge",
    ownTerms: "Ursprüngliche Autoren und Quell-URLs bleiben je Eintrag erhalten. GPT Image Hub ergänzt Ordnung, Korrekturen, Export-Metadaten und neu generierte Beispielbilder. Wer den Prompt-Text weiterverwendet, muss gemäß [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) die Quelle nennen und Änderungen kenntlich machen. Neu generierte Beispiele sind keine Werke der ursprünglichen Autoren.",
    contact: "Für Korrekturen, eine geänderte Quellenangabe oder eine Entfernung bitte Slug und Originalquelle in einem [Issue](https://github.com/jqy-yo/gptimagehub-prompts/issues) oder über die [Kontaktseite der Website](https://www.gptimagehub.com/about) senden.",
    mcp: "MCP-Zugang",
    mcpIntro: "Im offiziellen MCP Registry: [`io.github.jqy-yo/gptimagehub`, v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0). Ohne API-Schlüssel über Streamable HTTP Prompts suchen, vollständige Vorlagen abrufen und Kategorien auflisten:",
    mcpNote: "Für das Generieren sind eine separate Anmeldung und Credits nötig. Die öffentliche Suche umfasst keine Generierungsrechte.",
    review: "Bei Übersetzungen helfen",
    reviewText: "Muttersprachler für Japanisch, Koreanisch, Deutsch, Französisch, Spanisch und brasilianisches Portugiesisch können die Übersetzungsvorschläge in [translation-review](translation-review) prüfen. Die Entwürfe wurden per KI geprüft und automatisch getestet; die Freigabe durch Muttersprachler steht noch aus. Siehe [CONTRIBUTING.md](CONTRIBUTING.md).",
    rebuild: "Galerien neu erzeugen",
    rebuildText: "Nach Änderungen an einem der Datensätze oder am Beispielindex `node scripts/build-gallery.mjs` ausführen. Das Skript erzeugt aus den Datendateien die Galerien des Snapshots mit Quellenangabe und diese READMEs; die Galerien der Open-Source-Sammlung stammen aus der Import-Pipeline. Es erzeugt nur Markdown und ruft keinen Bildgenerierungsdienst auf.",
  },
  ko: {
    tagline: n => `**미리보기가 있는 이미지 프롬프트 템플릿 ${n}개.** 전체 프롬프트는 영어·일본어·중국어로, 제목·설명·태그는 18개 언어로 제공합니다. 카테고리별로 둘러보고 템플릿을 복사하거나 웹사이트에서 바로 생성하세요.`,
    site: "GPT Image Hub 열기", browse: "카테고리별 보기", data: "데이터와 라이선스",
    featured: "추천", featuredNote: "이미지를 클릭하면 웹사이트에서 해당 템플릿이 열립니다. 처음 여섯 개 커버는 GPT Image Hub가 오픈소스 컬렉션의 프롬프트로 생성했고, 마지막 세 개는 출처 표기 스냅샷용으로 새로 생성한 예시입니다.",
    ossCover: "GPT Image Hub에서 생성한 커버", basedOn: (c, l) => `출처: ${c} (${l})`, generated: "새로 생성한 예시", template: "템플릿 작성자", view: "프롬프트 보기 및 사용",
    tableCategory: "카테고리", tableCount: "템플릿 수", tableGalleries: "갤러리", ossGallery: "오픈소스 컬렉션", ownGallery: "출처 표기 스냅샷",
    galleryNote: "각 갤러리는 미리보기와 함께 일부를 보여 줍니다. 전체 레코드는 아래 데이터 파일과 웹사이트에 있습니다.",
    dataset: "데이터셋", records: "레코드 수", license: "라이선스", files: "파일", ossName: "오픈소스 컬렉션", ownName: "출처 표기 스냅샷", perRecord: "레코드별 MIT 또는 CC BY 4.0",
    ossAbout: "MIT 및 CC BY 4.0 라이선스의 GitHub 컬렉션을 바탕으로 한 템플릿입니다. 프롬프트를 영어로 다시 쓰고 정리했으며 일본어·중국어 버전을 함께 제공합니다. 제목·설명·태그를 새로 만들어 18개 언어로 번역했고, 모든 커버를 새로 생성했습니다. 파일은 카테고리별로 나뉘어 있습니다",
    ownAbout: n => `원작자와 원본 게시물을 레코드마다 보존한 CC BY 4.0 레코드 ${n}개(2026-10-21 기준). 다음에서도 볼 수 있습니다:`,
    fields: "필드", fileList: "파일 목록", cdn: "이미지 URL은 공개 CDN을 가리키므로 저장소를 클론해도 이미지 파일은 내려받지 않습니다. 모델 힌트는 템플릿이 겨냥한 모델일 뿐, 출력이 검증된 모델은 아닙니다.",
    more: "더 보기", methodology: "데이터셋 방법론", api: "API 문서",
    attribution: "출처 표기와 라이선스",
    attributionIntro: "각 레코드는 출처의 라이선스를 따릅니다. 링크된 이미지와 제3자 명칭에는 별도의 권리가 있으며 이 데이터셋으로 재라이선스되지 않습니다. 보증이나 제휴를 의미하지 않습니다.",
    ossNotices: "원본 라이선스 고지는 [LICENSES/](LICENSES/), 변경 사항은 [data/open-source/README.md](data/open-source/README.md) 참고",
    ownAdapted: "다음을 바탕으로 편집", recordsWord: "개",
    ownTerms: "원작자와 출처 URL은 레코드마다 보존됩니다. GPT Image Hub는 정리, 수정, 내보내기 메타데이터, 새로 생성한 예시 이미지를 더했습니다. 프롬프트 텍스트를 재사용할 때는 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)에 따라 출처를 표기하고 변경 사항을 밝혀야 합니다. 새로 생성한 예시는 원작자의 작품이 아닙니다.",
    contact: "템플릿 수정, 출처 정정, 삭제 요청은 slug와 원본 출처를 적어 [issue](https://github.com/jqy-yo/gptimagehub-prompts/issues)를 올리거나 [웹사이트 문의 페이지](https://www.gptimagehub.com/about)로 연락해 주세요.",
    mcp: "MCP 연동",
    mcpIntro: "공식 MCP Registry에 등록됨: [`io.github.jqy-yo/gptimagehub`, v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0). API 키 없이 Streamable HTTP로 프롬프트를 검색하고 전체 템플릿과 카테고리 목록을 가져올 수 있습니다:",
    mcpNote: "이미지 생성에는 별도 인증과 크레딧이 필요합니다. 공개 검색에는 생성 권한이 포함되지 않습니다.",
    review: "번역 검토에 참여하기",
    reviewText: "일본어, 한국어, 독일어, 프랑스어, 스페인어, 브라질 포르투갈어 원어민이라면 [translation-review](translation-review)의 번역안을 검토해 주세요. 초안은 AI 검토와 자동 검사를 거쳤지만 원어민 확인은 아직입니다. 자세한 내용은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고하세요.",
    rebuild: "갤러리 다시 만들기",
    rebuildText: "데이터셋이나 예시 목록을 바꾼 뒤 `node scripts/build-gallery.mjs`를 실행하세요. 데이터 파일로 출처 표기 스냅샷의 갤러리와 이 README들을 만들고, 오픈소스 컬렉션 갤러리는 가져오기 파이프라인에서 만들어집니다. Markdown만 만들며 이미지 생성 서비스는 호출하지 않습니다.",
  },
  vi: {
    tagline: n => `**${n} mẫu prompt tạo ảnh kèm ảnh xem trước.** Prompt đầy đủ bằng tiếng Anh, tiếng Nhật và tiếng Trung; tiêu đề, mô tả và thẻ bằng 18 ngôn ngữ. Duyệt theo danh mục, sao chép mẫu hoặc tạo ảnh ngay trên website.`,
    site: "Mở GPT Image Hub", browse: "Duyệt theo danh mục", data: "Dữ liệu và giấy phép",
    featured: "Nổi bật", featuredNote: "Bấm vào ảnh để mở mẫu trên website. Sáu ảnh bìa đầu tiên do GPT Image Hub tạo từ prompt của bộ sưu tập mã nguồn mở; ba ảnh cuối là ví dụ mới tạo cho bản chụp có ghi nguồn.",
    ossCover: "Ảnh bìa do GPT Image Hub tạo", basedOn: (c, l) => `Nguồn: ${c} (${l})`, generated: "Ví dụ mới tạo", template: "Tác giả mẫu", view: "Xem và dùng prompt",
    tableCategory: "Danh mục", tableCount: "Số mẫu", tableGalleries: "Thư viện ảnh", ossGallery: "Bộ sưu tập mã nguồn mở", ownGallery: "Bản chụp có ghi nguồn",
    galleryNote: "Mỗi thư viện hiển thị một phần mẫu kèm ảnh xem trước; toàn bộ bản ghi có trong các tệp dữ liệu bên dưới và trên website.",
    dataset: "Bộ dữ liệu", records: "Bản ghi", license: "Giấy phép", files: "Tệp", ossName: "Bộ sưu tập mã nguồn mở", ownName: "Bản chụp có ghi nguồn", perRecord: "MIT hoặc CC BY 4.0, theo từng bản ghi",
    ossAbout: "Các mẫu dựa trên những bộ sưu tập GitHub theo giấy phép MIT và CC BY 4.0: prompt được viết lại và sắp xếp bằng tiếng Anh, kèm bản tiếng Nhật và tiếng Trung; tiêu đề, mô tả và thẻ mới được dịch sang 18 ngôn ngữ; mỗi bản ghi đều có ảnh bìa mới tạo. Các tệp được chia theo danh mục",
    ownAbout: n => `${n} bản ghi CC BY 4.0, mỗi bản ghi giữ tác giả gốc và bài đăng gốc, chụp ngày 2026-10-21. Cũng có trên`,
    fields: "Trường", fileList: "danh sách tệp", cdn: "URL ảnh trỏ tới CDN công khai, nên clone repository sẽ không tải tệp ảnh về. Gợi ý mô hình chỉ cho biết mẫu được viết cho mô hình nào, không phải mô hình đã kiểm chứng kết quả.",
    more: "Thêm", methodology: "Phương pháp xây dựng bộ dữ liệu", api: "Tài liệu API",
    attribution: "Ghi nguồn và giấy phép",
    attributionIntro: "Mỗi bản ghi giữ giấy phép của nguồn. Ảnh được liên kết và tên của bên thứ ba có quyền riêng và không được cấp phép lại bởi bộ dữ liệu này. Điều này không hàm ý bất kỳ sự bảo trợ nào.",
    ossNotices: "thông báo giấy phép gốc trong [LICENSES/](LICENSES/), mô tả thay đổi trong [data/open-source/README.md](data/open-source/README.md)",
    ownAdapted: "chuyển thể từ", recordsWord: "bản ghi",
    ownTerms: "Tác giả gốc và URL nguồn được giữ lại trong từng bản ghi. GPT Image Hub bổ sung việc sắp xếp, chỉnh sửa, siêu dữ liệu xuất và ảnh ví dụ mới tạo. Khi dùng lại nội dung prompt, cần ghi nguồn và nêu rõ thay đổi theo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Ảnh ví dụ mới tạo không phải tác phẩm của tác giả gốc.",
    contact: "Để sửa mẫu, chỉnh ghi nguồn hoặc yêu cầu gỡ bỏ, hãy gửi slug và nguồn gốc qua [issue](https://github.com/jqy-yo/gptimagehub-prompts/issues) hoặc [trang liên hệ của website](https://www.gptimagehub.com/about).",
    mcp: "Truy cập MCP",
    mcpIntro: "Có trong MCP Registry chính thức: [`io.github.jqy-yo/gptimagehub`, v1.0.0](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.jqy-yo%2Fgptimagehub/versions/1.0.0). Không cần API key, dùng Streamable HTTP để tìm prompt, lấy toàn bộ mẫu và xem danh sách danh mục:",
    mcpNote: "Tạo ảnh cần đăng nhập riêng và tín dụng. Tìm kiếm công khai không bao gồm quyền tạo ảnh.",
    review: "Góp ý bản dịch",
    reviewText: "Người bản ngữ tiếng Nhật, Hàn, Đức, Pháp, Tây Ban Nha và Bồ Đào Nha (Brazil) có thể xem lại bản dịch đề xuất trong [translation-review](translation-review). Bản nháp đã qua kiểm tra bằng AI và kiểm tra tự động; vẫn cần người bản ngữ xác nhận. Xem [CONTRIBUTING.md](CONTRIBUTING.md).",
    rebuild: "Tạo lại thư viện ảnh",
    rebuildText: "Sau khi cập nhật bộ dữ liệu hoặc danh sách ví dụ, chạy `node scripts/build-gallery.mjs`. Script tạo thư viện ảnh của bản chụp có ghi nguồn và các README này từ tệp dữ liệu; thư viện của bộ sưu tập mã nguồn mở do quy trình nhập tạo ra. Script chỉ tạo Markdown và không gọi dịch vụ tạo ảnh nào.",
  },
};
// GitHub's heading anchors: lower case, punctuation dropped (letters, combining marks and digits kept), spaces to hyphens.
const anchor = text => text.trim().toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
const n = value => value.toLocaleString("en");

function readme({ code, site }, index) {
  const siteUrl = path => `https://www.gptimagehub.com${site ? `/${site}` : ""}${path ? `/${path}` : site ? "" : "/"}`;
  const t = TEXT[code];
  // Open-source records carry translated titles; the attributed snapshot is English only.
  const title = (entry, oss) => (oss && entry.translations?.[code]?.title) || entry.title;
  const cell = (entry, oss) => `<td width="33%" valign="top" align="center"><a href="${url(entry.canonical_url)}"><img src="${url(oss ? entry.cover_image_url : image(entry, false))}" width="260" alt="${html(title(entry, oss))}"></a><br><strong><a href="${url(entry.canonical_url)}">${html(title(entry, oss))}</a></strong><br><sub>${oss
    ? `${t.ossCover}</sub><br><sub>${t.basedOn(`<a href="${url(entry.source_collection)}">${html(collectionName(entry.source_collection))}</a>`, html(entry.license))}`
    : `${t.generated}</sub><br><sub>${t.template}: <a href="${url(entry.source_url ?? entry.canonical_url)}">${html(entry.source_author || "GPT Image Hub")}</a>`}</sub><br><a href="${url(entry.canonical_url)}">${t.view}</a></td>`;
  const cells = [...ossFeatured.map(entry => cell(entry, true)), ...featured.slice(0, 3).map(entry => cell(entry, false))];
  const featuredGrid = ["<table>", ...Array.from({ length: Math.ceil(cells.length / 3) }, (_, i) => ["<tr>", ...cells.slice(i * 3, i * 3 + 3), "</tr>"]).flat(), "</table>"].join("\n");
  const categories = Object.entries(CATEGORY_NAMES).map(([slug, names]) => {
    const oss = ossRows.filter(row => row.category === slug).length;
    const own = rows.filter(row => row.category === slug).length;
    const links = [oss && `[${t.ossGallery}](gallery/open-source/${slug}.md)`, own && `[${t.ownGallery}](gallery/${slug}.md)`].filter(Boolean).join(" · ");
    return { count: oss + own, line: `| [${names[index]}](${siteUrl(`library/category/${slug}`)}) | ${n(oss + own)} | ${links} |` };
  }).filter(row => row.count).sort((a, b) => b.count - a.count);
  const ossLicenses = Object.entries(Object.groupBy(ossRows, row => row.source_collection)).sort((a, b) => b[1].length - a[1].length)
    .map(([collection, list]) => `- [${collectionName(collection)}](${collection}) · ${list[0].license} · ${n(list.length)} ${t.recordsWord}`).join("\n");
  const switcher = README_LANGUAGES.map(other => other.code === code ? `**${other.name}**` : `[${other.name}](${other.file})`).join(" | ");
  return `${switcher}

# GPT Image Hub Prompts

${t.tagline(n(total))}

[**${t.site}**](${siteUrl("")}) · [**${t.browse}**](#${anchor(t.browse)}) · [**${t.data}**](#${anchor(t.data)}) · [**MCP**](#${anchor(t.mcp)})

## ${t.featured}

${featuredGrid}

${t.featuredNote}

## ${t.browse}

| ${t.tableCategory} | ${t.tableCount} | ${t.tableGalleries} |
|---|---:|---|
${categories.map(row => row.line).join("\n")}

${t.galleryNote}

## ${t.data}

| ${t.dataset} | ${t.records} | ${t.license} | ${t.files} |
|---|---:|---|---|
| ${t.ossName} | ${n(ossRows.length)} | ${t.perRecord} | [data/open-source/](data/open-source/README.md) |
| ${t.ownName} | ${n(rows.length)} | CC BY 4.0 | [data/prompts.jsonl](data/prompts.jsonl) · [manifest.json](manifest.json) |

**${t.ossName}.** ${t.ossAbout} ([${t.fileList}](data/open-source/README.md)). ${t.fields}: \`slug\`, \`title\`, \`description\`, \`prompt_text\`, \`prompt_text_ja\`, \`prompt_text_zh\`, \`category\`, \`tags\`, \`model_hint\`, \`aspect_ratio\`, \`canonical_url\`, \`source_collection\`, \`license\`, \`cover_image_url\`, \`translations\`.

**${t.ownName}.** ${t.ownAbout(rows.length)} [Hugging Face](https://huggingface.co/datasets/jqyyyy/gptimagehub-prompts) ([dataset card](DATASET_CARD.md)). ${t.fields}: \`slug\`, \`title\`, \`description\`, \`prompt_text\`, \`category\`, \`tags\`, \`model_hint\`, \`canonical_url\`, \`source_author\`, \`source_url\`, \`source_collection\`, \`license\`, \`cover_image_url\`, \`example_image_urls\`.

${t.cdn}

\`\`\`python
import json
from pathlib import Path

prompts = [json.loads(line) for path in sorted(Path("data/open-source").glob("*.jsonl"))
           for line in path.read_text().splitlines()]
prompts += [json.loads(line) for line in Path("data/prompts.jsonl").read_text().splitlines()]
print(len(prompts), prompts[0]["title"], prompts[0]["cover_image_url"])
\`\`\`

${t.more}: [${t.methodology}](https://www.gptimagehub.com/prompt-dataset-methodology) · [${t.api}](https://www.gptimagehub.com/api-docs)

## ${t.attribution}

${t.attributionIntro}

**${t.ossName}** (${t.ossNotices}):

${ossLicenses}

**${t.ownName}**, ${t.ownAdapted}:

- [Evolink's awesome-gpt-image-2-prompts](https://github.com/BarryYin/awesome-gpt-image-2-prompts), [CC BY 4.0](https://github.com/BarryYin/awesome-gpt-image-2-prompts/blob/main/LICENSE), copyright 2026 Evolink.
- [YouMind OpenLab's awesome-gpt-image-2](https://github.com/YouMind-OpenLab/awesome-gpt-image-2), [CC BY 4.0](https://github.com/YouMind-OpenLab/awesome-gpt-image-2/blob/main/LICENSE), copyright 2026 YouMind OpenLab.

${t.ownTerms}

${t.contact}

## ${t.mcp}

${t.mcpIntro}

\`\`\`json
{"mcpServers":{"gptimagehub":{"url":"https://www.gptimagehub.com/mcp"}}}
\`\`\`

${t.mcpNote}

## ${t.review}

${t.reviewText}

## ${t.rebuild}

${t.rebuildText}
`;
}
for (const [index, language] of README_LANGUAGES.entries()) await writeFile(new URL(`../${language.file}`, import.meta.url), readme(language, index));
console.log(`Built ${groups.length} category galleries for ${rows.length} prompts, ${examples.length} generated examples and READMEs in ${README_LANGUAGES.length} languages.`);
