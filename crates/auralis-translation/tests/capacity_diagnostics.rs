use auralis_translation::source_capacity_mismatch;

#[test]
fn changed_or_missing_source_capacity_warns() {
    for (source, candidate) in [
        ("容量512G", "Объём 2230 ГБ"),
        (
            "出厂只提供512G可选 想要更大容量你只能自己换了",
            "Накопитель 2230 ГБ",
        ),
        ("16G内存", "8 ГБ памяти"),
        ("内存16G", "Память 8 ГБ"),
        ("显存８G", "Видеопамять 6 ГБ"),
        ("硬盘512G", "Накопитель 256 ГБ"),
        ("容量1.5GB", "Объём 1,4 ГБ"),
        ("容量512GB", "Объём неизвестен"),
        ("容量512GB", "Объём 512 ГБ и ещё 512 ГБ"),
    ] {
        assert!(
            source_capacity_mismatch(source, candidate),
            "{source} / {candidate}"
        );
    }
}

#[test]
fn equivalent_and_ambiguous_capacity_text_does_not_warn() {
    for (source, candidate) in [
        ("内存16G", "Память 16 ГБ"),
        ("16G内存", "16 гигабайт памяти"),
        ("容量１．５G", "Объём 1,5 ГБ"),
        ("容量512GB", "Объём 512 GB"),
        ("型号A512G", "Модель другая"),
        ("SSD A-512G", "Модель другая"),
        ("SSD A512GB", "Модель другая"),
        ("容量16Gb", "Объём 16 ГБ"),
        ("容量16GB/s", "Пропускная способность 16 ГБ/с"),
        ("内存16G 容量32G", "Память 8 ГБ и накопитель 64 ГБ"),
        ("重量60G", "Вес 30 граммов"),
        ("内存16G 重量600G", "Память 16 ГБ, вес 600 граммов"),
        ("重量16g", "Вес 16 граммов"),
        ("容量512TB", "Объём 512 ТБ"),
    ] {
        assert!(
            !source_capacity_mismatch(source, candidate),
            "{source} / {candidate}"
        );
    }
}
