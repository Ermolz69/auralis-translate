use super::{ContractError, SegmentId, SourceHash, SourceSegment};
use std::collections::HashSet;
use std::ops::Range;

const SCENE_MAP_VERSION: u32 = 1;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SceneMap {
    ordered_ids: Vec<SegmentId>,
    ranges: Vec<Range<usize>>,
}

impl SceneMap {
    pub fn new(
        segments: &[SourceSegment],
        scene_end_ids: &[SegmentId],
    ) -> Result<Self, ContractError> {
        if segments.is_empty() || scene_end_ids.is_empty() {
            return Err(ContractError::InvalidSceneMap);
        }
        let ordered_ids = segments.iter().map(SourceSegment::id).collect::<Vec<_>>();
        let mut unique = HashSet::with_capacity(ordered_ids.len());
        if ordered_ids.iter().any(|id| !unique.insert(*id)) {
            return Err(ContractError::DuplicateSegmentId);
        }
        let mut ranges = Vec::with_capacity(scene_end_ids.len());
        let mut start = 0;
        for end_id in scene_end_ids {
            let Some(relative) = ordered_ids[start..].iter().position(|id| id == end_id) else {
                return Err(ContractError::InvalidSceneMap);
            };
            let end = start + relative + 1;
            ranges.push(start..end);
            start = end;
        }
        if start != ordered_ids.len() {
            return Err(ContractError::InvalidSceneMap);
        }
        Ok(Self {
            ordered_ids,
            ranges,
        })
    }

    pub fn ranges(&self) -> &[Range<usize>] {
        &self.ranges
    }

    pub fn matches(&self, segments: &[SourceSegment]) -> bool {
        self.ordered_ids.len() == segments.len()
            && self
                .ordered_ids
                .iter()
                .zip(segments)
                .all(|(id, segment)| *id == segment.id())
    }

    pub fn fingerprint(&self) -> SourceHash {
        let mut bytes = Vec::with_capacity(8 + self.ordered_ids.len() * 4 + self.ranges.len() * 4);
        bytes.extend_from_slice(&SCENE_MAP_VERSION.to_le_bytes());
        bytes.extend_from_slice(&(self.ordered_ids.len() as u32).to_le_bytes());
        for id in &self.ordered_ids {
            bytes.extend_from_slice(&id.get().to_le_bytes());
        }
        for range in &self.ranges {
            bytes.extend_from_slice(&self.ordered_ids[range.end - 1].get().to_le_bytes());
        }
        SourceHash::digest(&bytes)
    }
}
