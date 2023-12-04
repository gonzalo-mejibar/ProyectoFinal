import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { jwtDecode } from 'jwt-decode';
import './styles/Reserva.css'
import { format } from 'date-fns';

const Reserva = () => {

    const location = useLocation();
    const [excludeDates, setExcludeDates] = useState([])
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [maxDate, setMaxDate] = useState(null)
    const [error, setError] = useState(true)
    const [isMobile, setIsMobile] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [popUp, setPopup] = useState(false)
    const [userInfo, setUserInfo] = useState({
        nombre: "",
        apellido: "",
        email: ""
    })

    const auto = location.state.auto;
    console.log(auto);

    useEffect(() => {

        if (location.state == null) {
            window.location.replace('/')
            return
        }

        const decoded = jwtDecode(location.state.token);
        const name = decoded.nombre.split(" ");
        const info = {
            nombre: name[0],
            apellido: name[1],
            email: decoded.sub
        }
        setUserInfo(info)

        fetch(`http://localhost:8080/api/reservas/${auto.id}`, {
            method: 'GET',
            headers: {
                'content-type': "application/json"
            }
        }).then(res => res.json())
            .then(data => {
                const reservas = data
                const auxFechas = reservas.map(f => ({ start: new Date(f.inicio), end: new Date(f.cierre + 'T23:59:59') }))
                setExcludeDates(auxFechas)
                setIsLoading(false);
                console.log(userInfo);
            })

        const handleResize = () => {
            if (window.innerWidth <= 1700) {
                setIsMobile(true);
            } else {
                setIsMobile(false);
            }
        }

        window.addEventListener('resize', handleResize);

        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };

    }, [])

    const handleDate = date => {
        const nuevaFecha = new Date(date)
        const excludeDatesFilter = excludeDates.map(fecha => fecha.start)
        const fechasFuturas = excludeDatesFilter.filter(fecha => fecha.getTime() > nuevaFecha.getTime());
        setMaxDate(fechasFuturas[0])
        setDateRange(date)
    }


    const handleReservar = () => {
        if (startDate == null || endDate == null) {
            return
        }

        setIsLoading(true)

        const inicio = startDate.toISOString().split('T')[0];
        const fin = endDate.toISOString().split('T')[0];

        const fechas = {
            inicio: inicio,
            fin: fin
        }

        fetch(`http://localhost:8080/api/reservas/${location.state.auto.id}`, {
            method: "POST",
            body: JSON.stringify(fechas),
            headers: {
                "authorization": "Bearer " + location.state.token,
                "content-type": "application/json"
            }
        }).then(res => {

            if (res.status === 200) {
                setDateRange([])
                setExcludeDates([...excludeDates, { start: new Date(fechas.inicio), end: new Date(fechas.fin + 'T23:59:59') }])
                setIsLoading(false)
                setPopup(true)
            }

        })

    }


    return (
        isLoading ? <LoadingSpinner /> :
            <div>
                {popUp ? <div className="overlay">
                    <div className="reserva-popup">
                        <span style={{ color: "#FFBE3F" }}>Muchas gracias!</span>
                        <h1>Tu reserva se realizo exitosamente!</h1>
                        <button onClick={() => setPopup(false)}>Seguir navegando</button>
                    </div>
                </div> : null}

                <div className='reserva-container'>
                    <div className='reserva-bloque-izquierdo'>
                        <div className='reserva-calendario'>
                            <h2>Selecciona tu fecha de reserva</h2>
                            <DatePicker
                                selectsRange={true}
                                startDate={startDate}
                                endDate={endDate}
                                onChange={fecha => handleDate(fecha)}
                                minDate={new Date()}
                                {...(maxDate !== null && { maxDate })}
                                monthsShown={isMobile ? 1 : 2}
                                excludeDateIntervals={excludeDates}
                                isClearable
                                inline
                                disabledKeyboardNavigation
                            />
                        </div>
                        <div className='reserva-datos'>
                            <h2>Completa tus datos</h2>
                            <div className="reserva-datos-usuario">
                                <div className='usuario-inputs-container'>
                                    <div className='usuario-input'>
                                        <label>Nombre</label>
                                        <input type="text" disabled value={userInfo.nombre} />
                                    </div>
                                    <div className='usuario-input'>
                                        <label>Apellido</label>
                                        <input type="text" disabled value={userInfo.apellido} />
                                    </div>
                                </div>
                                <div className='usuario-inputs-container'>
                                    <div className='usuario-input'>
                                        <label>Correo Electronico</label>
                                        <input type="text" disabled value={userInfo.email} />
                                    </div>
                                    <div className='usuario-input'>
                                        <label>Comentarios (Opcional)</label>
                                        <input type="text" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="reserva-detalle">
                        <img className='reserva-detalle-portada' src={auto.fotos[0].url} alt="" />
                        <div className="reserva-info">
                            <span>Auto</span>
                            <h1>{auto.modelo.marca.marca + " " + auto.modelo.modelo + " " + auto.anio.anio}</h1>
                            <span>Descripcion:</span>
                            <p>{auto.descripcion} </p>
                            <span>Caracteristicas</span>
                            <div className='reserva-detalle-caracteristicas'>
                                {auto.modelo.caracteristicas.map(c => (
                                    <div className='caracteristica-item'>
                                        <img width={20} src={c.url} alt="" />
                                        <p>{c.caracteristica}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="reserva-info-fechas">
                                <div className='reserva-info-fecha'>
                                    <span>Fecha de salida:</span>
                                    {startDate == null ? null : format(startDate, "dd/MM/yyyy")}
                                </div>
                                <div className='reserva-info-fecha'>
                                    <span>Fecha de llegada:</span>
                                    {endDate == null ? null : format(endDate, "dd/MM/yyyy")}
                                </div>
                            </div>
                            <button onClick={handleReservar} className='reservar-button'>Confirmar reserva</button>
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default Reserva