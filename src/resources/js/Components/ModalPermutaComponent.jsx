import { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export default function ModalPermutaComponent({ show, onClose, tipo, onGuardar }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setFormData({});
  }, [tipo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardar = () => {
    if (!formData.precio_costo || !formData.precio_venta || !formData.estado) {
      alert('Completa los precios y el estado del producto entregado.');
      return;
    }

    onGuardar(formData);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Registrar producto entregado ({tipo.replace('_', ' ')})</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {tipo === 'celular' && (
          <div className="row">
            <div className="col-md-6 mb-2"><input name="modelo" className="form-control" placeholder="Modelo" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="capacidad" className="form-control" placeholder="Capacidad" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="color" className="form-control" placeholder="Color" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="bateria" className="form-control" placeholder="Batería (%)" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="imei_1" className="form-control" placeholder="IMEI 1" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="imei_2" className="form-control" placeholder="IMEI 2" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2">
              <select name="estado_imei" className="form-control" onChange={handleChange}>
                <option value="">-- Estado IMEI --</option>
                <option value="libre">Libre</option>
                <option value="registrado">Registrado</option>
                <option value="imei1_libre_imei2_registrado">IMEI1 Libre / IMEI2 Registrado</option>
                <option value="imei1_registrado_imei2_libre">IMEI1 Registrado / IMEI2 Libre</option>
              </select>
            </div>
            <div className="col-md-6 mb-2"><input name="procedencia" className="form-control" placeholder="Procedencia" onChange={handleChange} /></div>
          </div>
        )}

        {tipo === 'computadora' && (
          <div className="row">
            <div className="col-md-6 mb-2"><input name="nombre" className="form-control" placeholder="Nombre" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="numero_serie" className="form-control" placeholder="Número de Serie" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="color" className="form-control" placeholder="Color" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="bateria" className="form-control" placeholder="Batería" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="ram" className="form-control" placeholder="RAM" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="almacenamiento" className="form-control" placeholder="Almacenamiento" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="procesador" className="form-control" placeholder="Procesador" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="procedencia" className="form-control" placeholder="Procedencia" onChange={handleChange} /></div>
          </div>
        )}

        {tipo === 'producto_general' && (
          <div className="row">
            <div className="col-md-6 mb-2"><input name="codigo" className="form-control" placeholder="Código" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="tipo" className="form-control" placeholder="Tipo" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="nombre" className="form-control" placeholder="Nombre" onChange={handleChange} /></div>
            <div className="col-md-6 mb-2"><input name="procedencia" className="form-control" placeholder="Procedencia" onChange={handleChange} /></div>
          </div>
        )}

        {/* Campos comunes */}
        <hr />
        <div className="row">
          <div className="col-md-6 mb-2">
            <input name="precio_costo" type="number" className="form-control" placeholder="Precio Costo (Bs)" onChange={handleChange} />
          </div>
          <div className="col-md-6 mb-2">
            <input name="precio_venta" type="number" className="form-control" placeholder="Precio Venta (Bs)" onChange={handleChange} />
          </div>
          <div className="col-md-6 mb-2">
            <select name="estado" className="form-control" onChange={handleChange}>
              <option value="">-- Estado del producto --</option>
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
              <option value="permuta">Permuta</option>
            </select>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleGuardar}>Guardar</Button>
      </Modal.Footer>
    </Modal>
  );
}
