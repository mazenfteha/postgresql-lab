import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

// Local sentence-embedding model (downloaded once, then cached). Output: 384 numbers per text.
export const MODEL = "Xenova/all-MiniLM-L6-v2";
export const DIM = 384;

let extractor: Promise<FeatureExtractionPipeline> | null = null;

// Mean pooling + normalize => unit-length vectors, so cosine distance (<=>) is the right metric.
export async function embed(texts: string[]): Promise<number[][]> {
  extractor ??= pipeline("feature-extraction", MODEL, { dtype: "fp32" }) as Promise<FeatureExtractionPipeline>;
  const output = await (await extractor)(texts, { pooling: "mean", normalize: true });
  return output.tolist() as number[][];
}

// pgvector's text format: '[0.1,0.2,...]', cast with ::vector in SQL.
export const toVector = (v: number[]) => `[${v.join(",")}]`;
