use crate::{
    ContractError, NameEntity, NameEntityId, NameOccurrence, NameRegistry, NameStatus, SceneMap,
    SourceHash, SourceSegment, TranslationId,
};
use std::collections::BTreeSet;
use std::num::NonZeroU32;

pub const SOURCE_NAME_EXTRACTION_POLICY: &str = "chinese-explicit-address-v1";
const SURNAMES: &str = "王李张劉刘陈陳杨楊黄黃赵趙吴吳周徐孙孫马馬朱胡郭何高林罗羅郑鄭梁谢謝宋唐许許韩韓冯馮邓鄧曹彭曾肖萧蕭田董袁潘于蒋蔣蔡余杜叶葉程魏苏蘇吕呂丁任沈姚卢盧姜崔钟鍾谭譚陆陸汪范金石廖贾賈夏韦韋付方白邹鄒孟熊秦邱江尹薛闫閆段雷侯龙龍史陶黎贺賀顾顧毛郝龚龔邵万萬钱錢严嚴覃武戴莫孔向汤湯";
const INTRODUCTIONS: &[&str] = &["我叫", "名叫", "名字是"];
const TITLES: &[&str] = &["老师", "先生", "女士", "教授", "医生"];
const META_MARKERS: &[&str] = &[
    "这个词",
    "这个名字",
    "翻译",
    "叫作",
    "品牌",
    "产品",
    "公司",
    "地名",
];

pub fn extract_source_names(
    translation_id: TranslationId,
    source_hash: SourceHash,
    segments: &[SourceSegment],
    scenes: &SceneMap,
) -> Result<NameRegistry, ContractError> {
    if !scenes.matches(segments) {
        return Err(ContractError::InvalidSceneMap);
    }
    let revision = NonZeroU32::MIN;
    let mut entries = Vec::new();
    for (scene_index, scene) in scenes.ranges().iter().enumerate() {
        let mut surfaces = BTreeSet::new();
        for segment in &segments[scene.clone()] {
            for line in segment.lines() {
                if metalinguistic(line) {
                    continue;
                }
                for (offset, character) in line.char_indices() {
                    let suffix = &line[offset..];
                    if matches!(character, '小' | '老') {
                        let mut chars = suffix.chars();
                        chars.next();
                        if let Some(surname) = chars.next().filter(|c| SURNAMES.contains(*c)) {
                            let surface = format!("{character}{surname}");
                            if bounded_address(line, offset, surface.len()) {
                                surfaces.insert(surface);
                            }
                        }
                    }
                    if SURNAMES.contains(character) {
                        for title in TITLES {
                            let surface = format!("{character}{title}");
                            if suffix.starts_with(&surface)
                                && bounded_address(line, offset, surface.len())
                            {
                                surfaces.insert(surface);
                            }
                        }
                    }
                }
                for prefix in INTRODUCTIONS {
                    for (start, _) in line.match_indices(prefix) {
                        let tail = &line[start + prefix.len()..];
                        let name = tail.chars().take_while(|c| han(*c)).collect::<String>();
                        if (2..=3).contains(&name.chars().count())
                            && name.chars().next().is_some_and(|c| SURNAMES.contains(c))
                            && !TITLES.iter().any(|title| name.ends_with(title))
                        {
                            surfaces.insert(name);
                        }
                    }
                }
            }
        }
        for surface in surfaces {
            let mut occurrences = Vec::new();
            for segment in &segments[scene.clone()] {
                for (line_index, line) in segment.lines().iter().enumerate() {
                    if metalinguistic(line) {
                        continue;
                    }
                    for (start, _) in line.match_indices(&surface) {
                        if !bounded_address(line, start, surface.len()) {
                            continue;
                        }
                        occurrences.push(NameOccurrence {
                            segment_id: segment.id(),
                            line_index,
                            bytes: start..start + surface.len(),
                            scene_index,
                            surface: surface.clone(),
                        });
                    }
                }
            }
            if occurrences.is_empty() {
                continue;
            }
            let id = u32::try_from(entries.len() + 1)
                .ok()
                .and_then(NameEntityId::new)
                .ok_or(ContractError::InvalidNameRegistry)?;
            entries.push(NameEntity {
                id,
                chinese: surface,
                possible_aliases: Vec::new(),
                occurrences,
                proposal: None,
                status: NameStatus::NeedsReview,
                revision,
            });
        }
    }
    let registry = NameRegistry::new(
        translation_id,
        source_hash,
        scenes.fingerprint(),
        SOURCE_NAME_EXTRACTION_POLICY.into(),
        revision,
        entries,
    )?;
    registry.validate_against(segments, scenes)?;
    Ok(registry)
}

fn han(character: char) -> bool {
    ('\u{3400}'..='\u{9fff}').contains(&character)
}
fn metalinguistic(line: &str) -> bool {
    META_MARKERS.iter().any(|marker| line.contains(marker))
}
fn quoted(line: &str, offset: usize) -> bool {
    let prefix = &line[..offset];
    prefix
        .chars()
        .filter(|c| matches!(c, '"' | '“' | '”' | '「' | '」' | '『' | '』'))
        .count()
        % 2
        != 0
}
fn bounded_address(line: &str, offset: usize, length: usize) -> bool {
    !quoted(line, offset)
        && line[offset + length..].chars().next().is_none_or(|c| {
            !han(c)
                || "来去说說问問把你您他她是有在请請会會能要给給走等已还還不没沒也都和与與"
                    .contains(c)
        })
}
