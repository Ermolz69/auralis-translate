use crate::EditSpec;
use auralis_translation::ResultId;

pub struct BranchEditSpec {
    pub edit: EditSpec,
    pub expected_head_result_id: ResultId,
}
