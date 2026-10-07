//! Chapter Companion demo.
//!
//! This crate sits beside the chapter's Qiskit and Hardhat code. It does not
//! replace that code. RustQIP runs the eight-qubit Hadamard measurement.
//! The ledger replays the QSecure rules in Rust: same canonical message,
//! same SHA-256, append, then check. WebAssembly carries both into the browser.
//! A Hardhat node is not part of this demo. Hardhat stays with the chapter code.

use qip::prelude::*;
use sha2::{Digest, Sha256};

const N_QUBITS: usize = 8;

#[derive(Clone, Debug, PartialEq)]
pub struct Shot {
    pub value: u64,
    pub bitstring: String,
    pub probability: f64,
}

/// One shot of H on each of eight qubits, then a computational-basis measurement.
///
/// Qubits are merged in creation order. The first qubit is the least
/// significant bit, so it is the rightmost character of the bitstring.
pub fn measure_shot() -> Shot {
    let mut builder = LocalBuilder::<f64>::default();
    let mut qubits = Vec::with_capacity(N_QUBITS);
    for _ in 0..N_QUBITS {
        let qubit = builder.qubit();
        qubits.push(builder.h(qubit));
    }
    let register = builder
        .merge_registers(qubits)
        .expect("eight qubits merge into one register");
    let (_, handle) = builder.measure(register);
    let (_, measured) = builder.calculate_state();
    let (value, probability) = measured.get_measurement(handle);
    Shot {
        value: value as u64,
        bitstring: format!("{:0width$b}", value, width = N_QUBITS),
        probability,
    }
}

pub fn payload(timestamp: u64, quantum_proof: u64, metadata: &str) -> Result<String, &'static str> {
    if metadata.is_empty() {
        return Err("metadata must be non-empty");
    }
    Ok(format!("{timestamp}|{quantum_proof}|{metadata}"))
}

pub fn fingerprint(
    timestamp: u64,
    quantum_proof: u64,
    metadata: &str,
) -> Result<String, &'static str> {
    let message = payload(timestamp, quantum_proof, metadata)?;
    let digest = Sha256::digest(message.as_bytes());
    Ok(hex::encode(digest))
}

/// Confirms a stored fingerprint against the observed metadata.
/// An edit that does not recompute the hash fails this check.
pub fn verify(
    timestamp: u64,
    quantum_proof: u64,
    observed_metadata: &str,
    stored_hash: &str,
) -> bool {
    match fingerprint(timestamp, quantum_proof, observed_metadata) {
        Ok(digest) => digest.eq_ignore_ascii_case(stored_hash.trim_start_matches("0x")),
        Err(_) => false,
    }
}

#[cfg(target_arch = "wasm32")]
mod wasm {
    use super::{fingerprint, measure_shot, payload, verify, Shot};
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen(getter_with_clone)]
    pub struct WasmShot {
        pub value: u32,
        pub bitstring: String,
        pub probability: f64,
    }

    impl From<Shot> for WasmShot {
        fn from(shot: Shot) -> Self {
            Self {
                value: shot.value as u32,
                bitstring: shot.bitstring,
                probability: shot.probability,
            }
        }
    }

    #[wasm_bindgen(js_name = measureShot)]
    pub fn measure_shot_js() -> WasmShot {
        measure_shot().into()
    }

    #[wasm_bindgen(js_name = canonicalPayload)]
    pub fn payload_js(
        timestamp: u64,
        quantum_proof: u64,
        metadata: &str,
    ) -> Result<String, JsError> {
        payload(timestamp, quantum_proof, metadata).map_err(JsError::new)
    }

    #[wasm_bindgen(js_name = fingerprintHex)]
    pub fn fingerprint_js(
        timestamp: u64,
        quantum_proof: u64,
        metadata: &str,
    ) -> Result<String, JsError> {
        fingerprint(timestamp, quantum_proof, metadata).map_err(JsError::new)
    }

    #[wasm_bindgen(js_name = verifyFingerprint)]
    pub fn verify_js(
        timestamp: u64,
        quantum_proof: u64,
        observed_metadata: &str,
        stored_hash: &str,
    ) -> bool {
        verify(timestamp, quantum_proof, observed_metadata, stored_hash)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_flipped_first_qubit_is_the_high_bit() {
        let mut builder = LocalBuilder::<f64>::default();
        let first = builder.qubit();
        let flipped = builder.not(first);
        let mut qubits = vec![flipped];
        for _ in 1..N_QUBITS {
            qubits.push(builder.qubit());
        }
        let register = builder.merge_registers(qubits).unwrap();
        let (_, handle) = builder.measure(register);
        let (_, measured) = builder.calculate_state();
        let (value, _) = measured.get_measurement(handle);
        assert_eq!(value, 1);
        assert_eq!(format!("{:08b}", value), "00000001");
    }

    #[test]
    fn hadamard_shot_is_one_byte() {
        let shot = measure_shot();
        assert_eq!(shot.bitstring.len(), N_QUBITS);
        assert!(shot.bitstring.chars().all(|bit| bit == '0' || bit == '1'));
        assert_eq!(u64::from_str_radix(&shot.bitstring, 2).unwrap(), shot.value);
        assert!(shot.value < 256);
        assert!(shot.probability > 0.0);
    }

    #[test]
    fn fingerprints_match_the_chapter_vectors() {
        let vectors: Vec<serde_json::Value> =
            serde_json::from_str(include_str!("../../test/vectors.json")).unwrap();
        for vector in vectors {
            let timestamp = vector["timestamp"].as_u64().unwrap();
            let quantum = vector["quantumProof"].as_u64().unwrap();
            let metadata = vector["metadata"].as_str().unwrap();
            let expected = vector["sha256"].as_str().unwrap();
            assert_eq!(fingerprint(timestamp, quantum, metadata).unwrap(), expected);
            assert!(verify(timestamp, quantum, metadata, expected));
            assert!(!verify(timestamp, quantum, "tampered", expected));
        }
    }
}
