-- Crear tabla historia_clinica para Sprint 3
-- Almacena datos médicos estructurados por turno/paciente

CREATE TABLE IF NOT EXISTS historia_clinica (
  id SERIAL PRIMARY KEY,
  
  -- Referencias
  turno_id INTEGER REFERENCES turnos(id) ON DELETE CASCADE,
  paciente_id INTEGER REFERENCES pacientes(id) ON DELETE CASCADE,
  especialista_id INTEGER REFERENCES empleados(id) ON DELETE CASCADE,
  
  -- Fecha de la atención
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Campos fijos obligatorios
  altura DECIMAL(5,2) CHECK (altura > 0 AND altura <= 300), -- cm, ej: 175.50
  peso DECIMAL(5,2) CHECK (peso > 0 AND peso <= 500),       -- kg, ej: 70.25
  temperatura DECIMAL(4,2) CHECK (temperatura >= 30 AND temperatura <= 45), -- °C, ej: 36.50
  presion VARCHAR(10) NOT NULL CHECK (presion ~ '^[0-9]{2,3}/[0-9]{2,3}$'), -- ej: "120/80"
  
  -- Campos dinámicos (máximo 3)
  datos_dinamicos JSONB DEFAULT '{}' CHECK (jsonb_array_length(jsonb_object_keys(datos_dinamicos)) <= 3),
  
  -- Observaciones adicionales del especialista
  observaciones TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_historia_clinica_paciente_id ON historia_clinica(paciente_id);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_especialista_id ON historia_clinica(especialista_id);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_turno_id ON historia_clinica(turno_id);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_fecha ON historia_clinica(fecha);

-- Índice GIN para búsquedas en campos dinámicos JSONB
CREATE INDEX IF NOT EXISTS idx_historia_clinica_datos_dinamicos ON historia_clinica USING GIN (datos_dinamicos);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_historia_clinica_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_historia_clinica_updated_at
    BEFORE UPDATE ON historia_clinica
    FOR EACH ROW
    EXECUTE FUNCTION update_historia_clinica_updated_at();

-- Política de seguridad RLS (Row Level Security)
ALTER TABLE historia_clinica ENABLE ROW LEVEL SECURITY;

-- Los especialistas pueden ver y editar historias de sus pacientes
CREATE POLICY "especialistas_can_manage_their_patients_historia" ON historia_clinica
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM turnos 
            WHERE turnos.id = historia_clinica.turno_id 
            AND turnos.especialistaid = auth.uid()::integer
        )
    );

-- Los pacientes pueden ver su propia historia clínica
CREATE POLICY "pacientes_can_view_own_historia" ON historia_clinica
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pacientes 
            WHERE pacientes.id = historia_clinica.paciente_id 
            AND pacientes.id = auth.uid()::integer
        )
    );

-- Los administradores pueden ver todas las historias clínicas
CREATE POLICY "admins_can_view_all_historia" ON historia_clinica
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM empleados 
            WHERE empleados.id = auth.uid()::integer 
            AND empleados.especialidad = 'administrador'
        )
    );

-- Insertar algunos datos de ejemplo (opcional)
-- Descomenta estas líneas si querés datos de prueba
/*
INSERT INTO historia_clinica (turno_id, paciente_id, especialista_id, fecha, altura, peso, temperatura, presion, datos_dinamicos, observaciones)
SELECT 
    t.id as turno_id,
    t.pacienteid as paciente_id,
    t.especialistaid as especialista_id,
    t.fecha::date,
    ROUND((160 + random() * 40)::numeric, 2) as altura, -- 160-200 cm
    ROUND((50 + random() * 50)::numeric, 2) as peso,    -- 50-100 kg
    ROUND((36 + random() * 2)::numeric, 2) as temperatura, -- 36-38°C
    CONCAT(FLOOR(100 + random() * 40), '/', FLOOR(60 + random() * 30)) as presion, -- 100-140 / 60-90
    '{"observacion": "Control rutinario", "seguimiento": "normal"}'::jsonb as datos_dinamicos,
    'Control médico general. Paciente en buen estado de salud.' as observaciones
FROM turnos t 
WHERE t.estado = 'realizado'
LIMIT 5;
*/