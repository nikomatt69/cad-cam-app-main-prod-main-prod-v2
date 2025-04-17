use wasm_bindgen::prelude::*;
use js_sys::{Float32Array, Uint32Array}; // Rimossi Array e Object non utilizzati
use serde::{Serialize, Deserialize};
use glam::{Vec3, Mat4};

// Strutture dati per la comunicazione con JS
#[derive(Serialize, Deserialize, Clone)] // Aggiunto Clone per risolvere l'errore
pub struct MeshData {
    vertices: Vec<f32>,
    indices: Vec<u32>,
}

#[derive(Serialize, Deserialize)]
pub struct OptimizedScene {
    draw_calls: u32,
    triangles: u32,
    lod_levels: Vec<LodLevel>,
}

#[derive(Serialize, Deserialize)]
pub struct LodLevel {
    distance: f32,
    detail_ratio: f32,
}

#[derive(Serialize, Deserialize)]
pub struct PerformanceSettings {
    target_fps: u32,
    resolution_scale: f32,
    lod_bias: f32,
    max_triangles: u32,
    frustum_culling: bool,
}

// Modulo principale per l'ottimizzazione
#[wasm_bindgen]
pub struct CADOptimizer {
    settings: PerformanceSettings,
    stats: PerformanceStats,
}

#[derive(Serialize, Deserialize, Clone)]
struct PerformanceStats {
    fps: f32,
    frame_time: f32,
    triangle_count: u32,
    draw_calls: u32,
    memory_usage: f32,
    gpu_usage: f32,
}

#[wasm_bindgen]
impl CADOptimizer {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console_log!("Initializing CAD Optimizer WASM module");
        
        // Inizializza con impostazioni predefinite
        let settings = PerformanceSettings {
            target_fps: 60,
            resolution_scale: 1.0,
            lod_bias: 0.0,
            max_triangles: 1_000_000,
            frustum_culling: true,
        };
        
        let stats = PerformanceStats {
            fps: 0.0,
            frame_time: 0.0,
            triangle_count: 0,
            draw_calls: 0,
            memory_usage: 0.0,
            gpu_usage: 0.0,
        };
        
        CADOptimizer { settings, stats }
    }
    
    // Imposta le configurazioni di performance
    #[wasm_bindgen]
    pub fn configure(&mut self, config_js: JsValue) -> Result<(), JsValue> {
        let config: PerformanceSettings = match serde_wasm_bindgen::from_value(config_js) {
            Ok(c) => c,
            Err(e) => return Err(JsValue::from_str(&format!("Failed to parse config: {}", e))),
        };
        self.settings = config;
        Ok(())
    }
    
    // Ottiene le statistiche di performance correnti
    #[wasm_bindgen]
    pub fn get_stats(&self) -> Result<JsValue, JsValue> {
        match serde_wasm_bindgen::to_value(&self.stats) {
            Ok(val) => Ok(val),
            Err(e) => Err(JsValue::from_str(&format!("Failed to serialize stats: {}", e))),
        }
    }
    
    // Aggiorna le statistiche
    #[wasm_bindgen]
    pub fn update_stats(&mut self, fps: f32, frame_time: f32, triangles: u32, draw_calls: u32) {
        self.stats.fps = fps;
        self.stats.frame_time = frame_time;
        self.stats.triangle_count = triangles;
        self.stats.draw_calls = draw_calls;
    }
    
    // Calcola le impostazioni di performance ottimali
    #[wasm_bindgen]
    pub fn calculate_optimal_settings(&mut self) -> Result<JsValue, JsValue> {
        // Adatta le impostazioni in base alle performance attuali
        if self.stats.fps < self.settings.target_fps as f32 * 0.8 {
            // Performance basse: riduci qualità
            self.settings.resolution_scale = (self.settings.resolution_scale * 0.9).max(0.5);
            self.settings.lod_bias += 0.1;
        } else if self.stats.fps > self.settings.target_fps as f32 * 1.2 {
            // Performance alte: aumenta qualità
            self.settings.resolution_scale = (self.settings.resolution_scale * 1.1).min(1.0);
            self.settings.lod_bias = (self.settings.lod_bias - 0.05).max(0.0);
        }
        
        // Corretto l'errore di tipo con gestione dell'errore esplicita
        match serde_wasm_bindgen::to_value(&self.settings) {
            Ok(val) => Ok(val),
            Err(e) => Err(JsValue::from_str(&format!("Failed to serialize settings: {}", e))),
        }
    }
    
    // Decimazione di mesh (riduzione del numero di triangoli)
    #[wasm_bindgen]
    pub fn decimate_mesh(&self, vertices_js: Float32Array, indices_js: Uint32Array, ratio: f32) -> Result<JsValue, JsValue> {
        // Converte gli array JS in vettori Rust
        let vertices = convert_float32_array_to_vec(vertices_js);
        let indices = convert_uint32_array_to_vec(indices_js);
        
        // Esegue la decimazione
        let decimated = self.perform_decimation(&vertices, &indices, ratio);
        
        // Corretto l'errore di tipo con gestione dell'errore esplicita
        match serde_wasm_bindgen::to_value(&decimated) {
            Ok(val) => Ok(val),
            Err(e) => Err(JsValue::from_str(&format!("Failed to serialize decimated mesh: {}", e))),
        }
    }
    
    // Esegue operazioni booleane
    #[wasm_bindgen]
    pub fn boolean_operation(&self, operation: &str, mesh_a_js: JsValue, mesh_b_js: JsValue) -> Result<JsValue, JsValue> {
        // Deserializza i dati mesh
        let mesh_a: MeshData = match serde_wasm_bindgen::from_value(mesh_a_js) {
            Ok(m) => m,
            Err(e) => return Err(JsValue::from_str(&format!("Failed to parse mesh A: {}", e))),
        };
        
        let mesh_b: MeshData = match serde_wasm_bindgen::from_value(mesh_b_js) {
            Ok(m) => m,
            Err(e) => return Err(JsValue::from_str(&format!("Failed to parse mesh B: {}", e))),
        };
        
        // Esegue l'operazione booleana
        let result = match operation {
            "union" => self.perform_boolean_union(&mesh_a, &mesh_b),
            "subtract" => self.perform_boolean_subtract(&mesh_a, &mesh_b),
            "intersect" => self.perform_boolean_intersect(&mesh_a, &mesh_b),
            _ => return Err(JsValue::from_str("Invalid boolean operation"))
        };
        
        // Corretto l'errore di tipo con gestione dell'errore esplicita
        match serde_wasm_bindgen::to_value(&result) {
            Ok(val) => Ok(val),
            Err(e) => Err(JsValue::from_str(&format!("Failed to serialize boolean result: {}", e))),
        }
    }
    
    // Calcola livelli LOD ottimali per una mesh
    #[wasm_bindgen]
    pub fn calculate_lod_levels(&self, complexity: u32) -> Result<JsValue, JsValue> {
        // Genera livelli LOD in base alla complessità della mesh
        let mut levels = Vec::new();
        
        // Definisci i livelli LOD in base alla complessità
        // Più complessa è la mesh, più livelli generiamo
        let num_levels = if complexity > 100000 { 4 } 
                         else if complexity > 10000 { 3 } 
                         else { 2 };
        
        for i in 0..num_levels {
            let detail_ratio = 1.0 - (i as f32 / num_levels as f32);
            let distance = (50.0 * (i + 1) as f32) * (1.0 + self.settings.lod_bias);
            
            levels.push(LodLevel { distance, detail_ratio });
        }
        
        // Corretto l'errore di tipo con gestione dell'errore esplicita
        match serde_wasm_bindgen::to_value(&levels) {
            Ok(val) => Ok(val),
            Err(e) => Err(JsValue::from_str(&format!("Failed to serialize LOD levels: {}", e))),
        }
    }
    
    // Calcola le normali della mesh
    #[wasm_bindgen]
    pub fn calculate_normals(&self, vertices_js: Float32Array, indices_js: Uint32Array) -> Result<Float32Array, JsValue> {
        let vertices = convert_float32_array_to_vec(vertices_js);
        let indices = convert_uint32_array_to_vec(indices_js);
        
        // Calcola le normali per vertice
        let normals = self.compute_smooth_normals(&vertices, &indices);
        
        // Converte il risultato in Float32Array
        let normals_array = Float32Array::new_with_length(normals.len() as u32);
        for (i, &value) in normals.iter().enumerate() {
            normals_array.set_index(i as u32, value);
        }
        
        Ok(normals_array)
    }
    
    // Verifica frustum culling (se un oggetto è visibile dalla camera)
    #[wasm_bindgen]
    pub fn is_in_frustum(&self, 
                        bbox_min_x: f32, bbox_min_y: f32, bbox_min_z: f32,
                        bbox_max_x: f32, bbox_max_y: f32, bbox_max_z: f32,
                        view_projection_matrix_js: Float32Array) -> bool {
        let view_proj_matrix = convert_float32_array_to_mat4(view_projection_matrix_js);
        let min = Vec3::new(bbox_min_x, bbox_min_y, bbox_min_z);
        let max = Vec3::new(bbox_max_x, bbox_max_y, bbox_max_z);
        
        self.check_box_in_frustum(min, max, view_proj_matrix)
    }
}

// Metodi privati dell'implementazione
impl CADOptimizer {
    // Algoritmo di decimazione della mesh
    fn perform_decimation(&self, vertices: &[f32], indices: &[u32], ratio: f32) -> MeshData {
        // Implementazione di un algoritmo di decimazione semplice
        // In una versione reale, useresti un algoritmo più sofisticato
        let _vertex_count = vertices.len() / 3; // Aggiunto underscore per evitare warning di variabile non usata
        let triangle_count = indices.len() / 3;
        
        // Calcola quanti triangoli tenere
        let target_triangles = (triangle_count as f32 * ratio).max(1.0) as usize;
        
        // Semplifica rimuovendo triangoli uniformemente
        let mut new_indices = Vec::with_capacity(target_triangles * 3);
        let step = (triangle_count as f32 / target_triangles as f32).max(1.0);
        
        for i in (0..triangle_count).step_by(step as usize) {
            if new_indices.len() < target_triangles * 3 {
                new_indices.push(indices[i * 3]);
                new_indices.push(indices[i * 3 + 1]);
                new_indices.push(indices[i * 3 + 2]);
            }
        }
        
        // Tieni tutti i vertici originali per semplicità
        // In una vera implementazione, elimineresti anche i vertici non utilizzati
        MeshData {
            vertices: vertices.to_vec(),
            indices: new_indices,
        }
    }
    
    // Operazione booleana - Unione
    fn perform_boolean_union(&self, mesh_a: &MeshData, mesh_b: &MeshData) -> MeshData {
        // In una vera implementazione, useresti una libreria CSG
        // Questa è solo una dimostrazione semplificata
        
        // Combina semplicemente i vertici e gli indici
        let mut result_vertices = mesh_a.vertices.clone();
        let mut result_indices = mesh_a.indices.clone();
        
        let vertex_offset = result_vertices.len() / 3;
        
        // Aggiungi i vertici di mesh_b
        result_vertices.extend_from_slice(&mesh_b.vertices);
        
        // Aggiungi gli indici di mesh_b, adattando per l'offset
        for &idx in &mesh_b.indices {
            result_indices.push(idx + vertex_offset as u32);
        }
        
        MeshData {
            vertices: result_vertices,
            indices: result_indices,
        }
    }
    
    // Operazione booleana - Sottrazione
    fn perform_boolean_subtract(&self, mesh_a: &MeshData, _mesh_b: &MeshData) -> MeshData {
        // Implementazione semplificata
        // Ora clone() funziona perché abbiamo aggiunto #[derive(Clone)] a MeshData
        mesh_a.clone()
    }
    
    // Operazione booleana - Intersezione
    fn perform_boolean_intersect(&self, mesh_a: &MeshData, mesh_b: &MeshData) -> MeshData {
        // Implementazione semplificata
        // In una vera implementazione, calcoleresti l'intersezione reale
        MeshData {
            vertices: mesh_a.vertices[0..mesh_a.vertices.len().min(mesh_b.vertices.len())].to_vec(),
            indices: mesh_a.indices[0..mesh_a.indices.len().min(mesh_b.indices.len())].to_vec(),
        }
    }
    
    // Calcola le normali smussate per una mesh
    fn compute_smooth_normals(&self, vertices: &[f32], indices: &[u32]) -> Vec<f32> {
        let vertex_count = vertices.len() / 3;
        let mut normals = vec![0.0; vertices.len()];
        
        // Per ogni triangolo
        for i in 0..(indices.len() / 3) {
            let idx1 = indices[i * 3] as usize;
            let idx2 = indices[i * 3 + 1] as usize;
            let idx3 = indices[i * 3 + 2] as usize;
            
            // Ottieni i tre vertici del triangolo
            let v1 = Vec3::new(
                vertices[idx1 * 3],
                vertices[idx1 * 3 + 1],
                vertices[idx1 * 3 + 2]
            );
            
            let v2 = Vec3::new(
                vertices[idx2 * 3],
                vertices[idx2 * 3 + 1],
                vertices[idx2 * 3 + 2]
            );
            
            let v3 = Vec3::new(
                vertices[idx3 * 3],
                vertices[idx3 * 3 + 1],
                vertices[idx3 * 3 + 2]
            );
            
            // Calcola la normale del triangolo
            let edge1 = v2 - v1;
            let edge2 = v3 - v1;
            let normal = edge1.cross(edge2).normalize();
            
            // Aggiungi la normale a tutti i vertici del triangolo
            for &idx in &[idx1, idx2, idx3] {
                normals[idx * 3] += normal.x;
                normals[idx * 3 + 1] += normal.y;
                normals[idx * 3 + 2] += normal.z;
            }
        }
        
        // Normalizza tutte le normali
        for i in 0..vertex_count {
            let nx = normals[i * 3];
            let ny = normals[i * 3 + 1];
            let nz = normals[i * 3 + 2];
            
            let length = (nx * nx + ny * ny + nz * nz).sqrt();
            
            if length > 0.0 {
                normals[i * 3] = nx / length;
                normals[i * 3 + 1] = ny / length;
                normals[i * 3 + 2] = nz / length;
            }
        }
        
        normals
    }
    
    // Verifica se un box è visibile nel frustum
    fn check_box_in_frustum(&self, min: Vec3, max: Vec3, view_proj: Mat4) -> bool {
        // Ottieni gli 8 angoli del box
        let corners = [
            Vec3::new(min.x, min.y, min.z),
            Vec3::new(max.x, min.y, min.z),
            Vec3::new(min.x, max.y, min.z),
            Vec3::new(max.x, max.y, min.z),
            Vec3::new(min.x, min.y, max.z),
            Vec3::new(max.x, min.y, max.z),
            Vec3::new(min.x, max.y, max.z),
            Vec3::new(max.x, max.y, max.z),
        ];
        
        // Verifica se almeno un angolo è dentro il frustum
        for corner in &corners {
            let clip_pos = view_proj.transform_point3(*corner);
            
            // Se tutti i componenti sono tra -w e w, il punto è visibile
            if clip_pos.x >= -clip_pos.z && clip_pos.x <= clip_pos.z &&
               clip_pos.y >= -clip_pos.z && clip_pos.y <= clip_pos.z &&
               clip_pos.z >= -1.0 && clip_pos.z <= 1.0 {
                return true;
            }
        }
        
        false
    }
}

// Funzioni di utilità
fn convert_float32_array_to_vec(array: Float32Array) -> Vec<f32> {
    let mut result = vec![0.0; array.length() as usize];
    array.copy_to(&mut result);
    result
}

fn convert_uint32_array_to_vec(array: Uint32Array) -> Vec<u32> {
    let mut result = vec![0; array.length() as usize];
    array.copy_to(&mut result);
    result
}

fn convert_float32_array_to_mat4(array: Float32Array) -> Mat4 {
    let mut matrix_data = [0.0; 16];
    array.copy_to(&mut matrix_data);
    
    Mat4::from_cols_array(&matrix_data)
}

// Macro per il logging console
#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => {
        web_sys::console::log_1(&format!($($t)*).into());
    }
}