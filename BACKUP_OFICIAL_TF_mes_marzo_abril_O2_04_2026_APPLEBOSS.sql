--
-- PostgreSQL database dump
--

\restrict 1SA1bHr6sjBQsOsROV0jHHNUIWTGilzpEkSYNs9snnYXnUFNjJ8kcnQyKL2LPTr

-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO "user";

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: user
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: automation_reports; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.automation_reports (
    id bigint NOT NULL,
    period character varying(255) NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.automation_reports OWNER TO "user";

--
-- Name: automation_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.automation_reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.automation_reports_id_seq OWNER TO "user";

--
-- Name: automation_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.automation_reports_id_seq OWNED BY public.automation_reports.id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);


ALTER TABLE public.cache OWNER TO "user";

--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);


ALTER TABLE public.cache_locks OWNER TO "user";

--
-- Name: celulares; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.celulares (
    id bigint NOT NULL,
    modelo character varying(255) NOT NULL,
    capacidad character varying(255) NOT NULL,
    color character varying(255) NOT NULL,
    bateria character varying(255),
    imei_1 character varying(255) NOT NULL,
    imei_2 character varying(255),
    estado_imei character varying(255) NOT NULL,
    procedencia character varying(255) NOT NULL,
    precio_costo numeric(10,2) NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    estado character varying(255) DEFAULT 'disponible'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT celulares_estado_check CHECK (((estado)::text = ANY (ARRAY[('disponible'::character varying)::text, ('vendido'::character varying)::text, ('permuta'::character varying)::text]))),
    CONSTRAINT celulares_estado_imei_check CHECK (((estado_imei)::text = ANY (ARRAY[('libre'::character varying)::text, ('registrado'::character varying)::text, ('imei1_libre_imei2_registrado'::character varying)::text, ('imei1_registrado_imei2_libre'::character varying)::text])))
);


ALTER TABLE public.celulares OWNER TO "user";

--
-- Name: celulares_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.celulares_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.celulares_id_seq OWNER TO "user";

--
-- Name: celulares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.celulares_id_seq OWNED BY public.celulares.id;


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.clientes (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    nombre character varying(255) NOT NULL,
    telefono character varying(255),
    correo character varying(255),
    documento character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.clientes OWNER TO "user";

--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.clientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.clientes_id_seq OWNER TO "user";

--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- Name: computadoras; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.computadoras (
    id bigint NOT NULL,
    numero_serie character varying(255) NOT NULL,
    nombre character varying(255) NOT NULL,
    procesador character varying(255),
    bateria character varying(255),
    color character varying(255) NOT NULL,
    ram character varying(255) NOT NULL,
    almacenamiento character varying(255) NOT NULL,
    procedencia character varying(255) NOT NULL,
    precio_costo numeric(10,2) NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    estado character varying(255) DEFAULT 'disponible'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT computadoras_estado_check CHECK (((estado)::text = ANY (ARRAY[('disponible'::character varying)::text, ('vendido'::character varying)::text, ('permuta'::character varying)::text])))
);


ALTER TABLE public.computadoras OWNER TO "user";

--
-- Name: computadoras_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.computadoras_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.computadoras_id_seq OWNER TO "user";

--
-- Name: computadoras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.computadoras_id_seq OWNED BY public.computadoras.id;


--
-- Name: cotizaciones; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.cotizaciones (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    cliente_id bigint,
    nombre_cliente character varying(255) NOT NULL,
    telefono character varying(255),
    correo_cliente character varying(255),
    items json NOT NULL,
    descuento numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    total numeric(10,2) NOT NULL,
    drive_url character varying(255),
    notas_adicionales text,
    fecha_cotizacion date NOT NULL,
    enviado_por_correo boolean DEFAULT false NOT NULL,
    enviado_por_whatsapp boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.cotizaciones OWNER TO "user";

--
-- Name: cotizaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.cotizaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cotizaciones_id_seq OWNER TO "user";

--
-- Name: cotizaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.cotizaciones_id_seq OWNED BY public.cotizaciones.id;


--
-- Name: egresos; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.egresos (
    id bigint NOT NULL,
    concepto character varying(255) NOT NULL,
    precio_invertido numeric(10,2) NOT NULL,
    tipo_gasto character varying(255) NOT NULL,
    frecuencia character varying(255),
    cuotas_pendientes smallint,
    comentario character varying(255),
    user_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT egresos_tipo_gasto_check CHECK (((tipo_gasto)::text = ANY (ARRAY[('servicio_basico'::character varying)::text, ('cuota_bancaria'::character varying)::text, ('gasto_personal'::character varying)::text, ('sueldos'::character varying)::text])))
);


ALTER TABLE public.egresos OWNER TO "user";

--
-- Name: egresos_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.egresos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.egresos_id_seq OWNER TO "user";

--
-- Name: egresos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.egresos_id_seq OWNED BY public.egresos.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.failed_jobs OWNER TO "user";

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.failed_jobs_id_seq OWNER TO "user";

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


ALTER TABLE public.job_batches OWNER TO "user";

--
-- Name: jobs; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


ALTER TABLE public.jobs OWNER TO "user";

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.jobs_id_seq OWNER TO "user";

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO "user";

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.migrations_id_seq OWNER TO "user";

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO "user";

--
-- Name: productos_apple; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.productos_apple (
    id bigint NOT NULL,
    modelo character varying(255) NOT NULL,
    capacidad character varying(255) NOT NULL,
    bateria character varying(255) NOT NULL,
    color character varying(255) NOT NULL,
    numero_serie character varying(255),
    procedencia character varying(255) NOT NULL,
    precio_costo numeric(10,2) NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    tiene_imei boolean DEFAULT false NOT NULL,
    imei_1 character varying(255),
    imei_2 character varying(255),
    estado_imei character varying(255),
    estado character varying(255) DEFAULT 'disponible'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT productos_apple_estado_imei_check CHECK (((estado_imei)::text = ANY (ARRAY[('Libre'::character varying)::text, ('Registro seguro'::character varying)::text, ('IMEI 1 libre y IMEI 2 registrado'::character varying)::text, ('IMEI 2 libre y IMEI 1 registrado'::character varying)::text])))
);


ALTER TABLE public.productos_apple OWNER TO "user";

--
-- Name: productos_apple_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.productos_apple_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.productos_apple_id_seq OWNER TO "user";

--
-- Name: productos_apple_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.productos_apple_id_seq OWNED BY public.productos_apple.id;


--
-- Name: productos_generales; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.productos_generales (
    id bigint NOT NULL,
    codigo character varying(255) NOT NULL,
    tipo character varying(255) NOT NULL,
    nombre character varying(255),
    procedencia character varying(255) NOT NULL,
    precio_costo numeric(10,2) NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    estado character varying(255) DEFAULT 'disponible'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT productos_generales_estado_check CHECK (((estado)::text = ANY (ARRAY[('disponible'::character varying)::text, ('vendido'::character varying)::text, ('permuta'::character varying)::text])))
);


ALTER TABLE public.productos_generales OWNER TO "user";

--
-- Name: productos_generales_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.productos_generales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.productos_generales_id_seq OWNER TO "user";

--
-- Name: productos_generales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.productos_generales_id_seq OWNED BY public.productos_generales.id;


--
-- Name: promociones_enviadas; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.promociones_enviadas (
    id bigint NOT NULL,
    cliente_id bigint NOT NULL,
    mensaje text NOT NULL,
    canal character varying(255) DEFAULT 'whatsapp'::character varying NOT NULL,
    enviado_en timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT promociones_enviadas_canal_check CHECK (((canal)::text = ANY (ARRAY[('whatsapp'::character varying)::text, ('email'::character varying)::text, ('sms'::character varying)::text])))
);


ALTER TABLE public.promociones_enviadas OWNER TO "user";

--
-- Name: promociones_enviadas_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.promociones_enviadas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.promociones_enviadas_id_seq OWNER TO "user";

--
-- Name: promociones_enviadas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.promociones_enviadas_id_seq OWNED BY public.promociones_enviadas.id;


--
-- Name: secuencias; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.secuencias (
    id bigint NOT NULL,
    clave character varying(255) NOT NULL,
    ultimo_numero bigint DEFAULT '0'::bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.secuencias OWNER TO "user";

--
-- Name: secuencias_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.secuencias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.secuencias_id_seq OWNER TO "user";

--
-- Name: secuencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.secuencias_id_seq OWNED BY public.secuencias.id;


--
-- Name: servicio_tecnicos; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.servicio_tecnicos (
    id bigint NOT NULL,
    codigo_nota character varying(20) NOT NULL,
    cliente character varying(255) NOT NULL,
    telefono character varying(255),
    equipo character varying(255) NOT NULL,
    detalle_servicio text NOT NULL,
    notas_adicionales text,
    precio_costo numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    precio_venta numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    tecnico character varying(255) NOT NULL,
    fecha date NOT NULL,
    user_id bigint NOT NULL,
    venta_id bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    cliente_id bigint
);


ALTER TABLE public.servicio_tecnicos OWNER TO "user";

--
-- Name: COLUMN servicio_tecnicos.codigo_nota; Type: COMMENT; Schema: public; Owner: user
--

COMMENT ON COLUMN public.servicio_tecnicos.codigo_nota IS 'C├│digo interno de servicio t├®cnico';


--
-- Name: servicio_tecnicos_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.servicio_tecnicos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.servicio_tecnicos_id_seq OWNER TO "user";

--
-- Name: servicio_tecnicos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.servicio_tecnicos_id_seq OWNED BY public.servicio_tecnicos.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


ALTER TABLE public.sessions OWNER TO "user";

--
-- Name: users; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    rol character varying(255) DEFAULT 'vendedor'::character varying NOT NULL,
    CONSTRAINT users_rol_check CHECK (((rol)::text = ANY (ARRAY[('admin'::character varying)::text, ('vendedor'::character varying)::text])))
);


ALTER TABLE public.users OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO "user";

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: ventas; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ventas (
    id bigint NOT NULL,
    nombre_cliente character varying(255) NOT NULL,
    telefono_cliente character varying(255),
    fecha date,
    codigo_nota character varying(10),
    tipo_venta character varying(255) NOT NULL,
    es_permuta boolean DEFAULT false NOT NULL,
    tipo_permuta character varying(255),
    cantidad integer DEFAULT 1 NOT NULL,
    precio_invertido numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    ganancia_neta numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    descuento numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    celular_id bigint,
    computadora_id bigint,
    producto_general_id bigint,
    entregado_celular_id bigint,
    entregado_computadora_id bigint,
    entregado_producto_general_id bigint,
    metodo_pago character varying(255) DEFAULT 'efectivo'::character varying NOT NULL,
    inicio_tarjeta character varying(255),
    fin_tarjeta character varying(255),
    notas_adicionales text,
    user_id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    valor_permuta numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    entregado_producto_apple_id bigint,
    CONSTRAINT ventas_metodo_pago_check CHECK (((metodo_pago)::text = ANY (ARRAY[('efectivo'::character varying)::text, ('qr'::character varying)::text, ('tarjeta'::character varying)::text]))),
    CONSTRAINT ventas_tipo_permuta_check CHECK (((tipo_permuta)::text = ANY (ARRAY[('celular'::character varying)::text, ('computadora'::character varying)::text, ('producto_general'::character varying)::text]))),
    CONSTRAINT ventas_tipo_venta_check CHECK (((tipo_venta)::text = ANY (ARRAY[('producto'::character varying)::text, ('servicio_tecnico'::character varying)::text])))
);


ALTER TABLE public.ventas OWNER TO "user";

--
-- Name: COLUMN ventas.codigo_nota; Type: COMMENT; Schema: public; Owner: user
--

COMMENT ON COLUMN public.ventas.codigo_nota IS 'C├│digo corto de venta ej: AT-V101';


--
-- Name: ventas_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.ventas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ventas_id_seq OWNER TO "user";

--
-- Name: ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.ventas_id_seq OWNED BY public.ventas.id;


--
-- Name: ventas_items; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ventas_items (
    id bigint NOT NULL,
    venta_id bigint NOT NULL,
    tipo character varying(255) NOT NULL,
    producto_id bigint NOT NULL,
    cantidad integer DEFAULT 1 NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    precio_invertido numeric(10,2),
    descuento numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.ventas_items OWNER TO "user";

--
-- Name: ventas_items_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.ventas_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ventas_items_id_seq OWNER TO "user";

--
-- Name: ventas_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.ventas_items_id_seq OWNED BY public.ventas_items.id;


--
-- Name: automation_reports id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.automation_reports ALTER COLUMN id SET DEFAULT nextval('public.automation_reports_id_seq'::regclass);


--
-- Name: celulares id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.celulares ALTER COLUMN id SET DEFAULT nextval('public.celulares_id_seq'::regclass);


--
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- Name: computadoras id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.computadoras ALTER COLUMN id SET DEFAULT nextval('public.computadoras_id_seq'::regclass);


--
-- Name: cotizaciones id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cotizaciones ALTER COLUMN id SET DEFAULT nextval('public.cotizaciones_id_seq'::regclass);


--
-- Name: egresos id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.egresos ALTER COLUMN id SET DEFAULT nextval('public.egresos_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: productos_apple id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.productos_apple ALTER COLUMN id SET DEFAULT nextval('public.productos_apple_id_seq'::regclass);


--
-- Name: productos_generales id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.productos_generales ALTER COLUMN id SET DEFAULT nextval('public.productos_generales_id_seq'::regclass);


--
-- Name: promociones_enviadas id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.promociones_enviadas ALTER COLUMN id SET DEFAULT nextval('public.promociones_enviadas_id_seq'::regclass);


--
-- Name: secuencias id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.secuencias ALTER COLUMN id SET DEFAULT nextval('public.secuencias_id_seq'::regclass);


--
-- Name: servicio_tecnicos id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.servicio_tecnicos ALTER COLUMN id SET DEFAULT nextval('public.servicio_tecnicos_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: ventas id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ventas ALTER COLUMN id SET DEFAULT nextval('public.ventas_id_seq'::regclass);


--
-- Name: ventas_items id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ventas_items ALTER COLUMN id SET DEFAULT nextval('public.ventas_items_id_seq'::regclass);


--
-- Data for Name: automation_reports; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.automation_reports (id, period, content, read, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.cache (key, value, expiration) FROM stdin;
appleboss_cache_santy19abasto@gmail.com|172.19.0.1:timer	i:1773704549;	1773704549
appleboss_cache_santy19abasto@gmail.com|172.19.0.1	i:3;	1773704549
\.


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.cache_locks (key, owner, expiration) FROM stdin;
\.


--
-- Data for Name: celulares; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.celulares (id, modelo, capacidad, color, bateria, imei_1, imei_2, estado_imei, procedencia, precio_costo, precio_venta, estado, created_at, updated_at) FROM stdin;
1	IPHONE 17 PRO MAX	512 GB	NARANJA	100	352116263167502	352116262754474	libre	JAIME JORDAN	14880.00	15810.00	vendido	2026-02-03 19:35:38	2026-02-03 19:43:46
2	IPHONE 13 PRO	128 GB	NEGRO	80	356133311635923	356133311603665	libre	OMAR ZAMBRANA 78340958	3100.00	4800.00	vendido	2026-02-04 18:09:00	2026-02-04 18:13:24
4	IPHONE XR	64 GB	NEGRO	74	356455109783213	356455107680999	imei1_registrado_imei2_libre	EDDY POKA CEL: 76428607	1000.00	1500.00	disponible	2026-02-04 19:45:26	2026-02-04 19:45:26
8	IPHONE 13 MINI	128 GB	BLANCO	77	353186438033516	353186438903478	libre	NICOL AMAYA	2700.00	3000.00	disponible	2026-02-04 20:11:54	2026-02-04 20:11:54
9	IPHONE 17 PRO MAX	256 GB	NARANJA	100	352791396642819	352791396676551	libre	JAIME JORDAN	13049.00	13600.00	vendido	2026-02-05 13:51:53	2026-02-05 14:10:27
10	PIXEL 8	128	NEGRO	100	356125690427765	356125699042773	libre	CARLOS EEUU	3291.00	3700.00	vendido	2026-02-05 20:05:06	2026-02-05 20:14:35
12	IPHONE 17 PRO	256	BLANCO	100 SELLADO	353407175312438	353407175377613	libre	JAIME JORDAN	11450.00	12310.00	vendido	2026-02-10 14:33:02	2026-02-10 14:34:41
3	IPHONE XR	128 GB	AZUL	100	353066100243090	353066100179690	libre	MARCELA ROJAS CEL : 68594660	1000.00	1700.00	vendido	2026-02-04 19:42:27	2026-02-10 14:41:56
13	IPHONE 13 PRO MAX	256 GB	NEGRO	79	359330185119565	359330185221320	libre	FABIAN AGUIRRE CEL : 79702003	4300.00	4700.00	vendido	2026-02-11 10:27:13	2026-02-11 10:29:35
22	IPHONE 14 PLUS	128 GB	CELESTE	90	358070208448242	358070208894809	libre	JUAN CARLOS VILLEGAS FACE STEVENS SCOTT	5100.00	4500.00	disponible	2026-02-13 14:32:45	2026-02-13 16:12:57
15	IPHONE 13 MINI	128 GB	AZUL	75	350257573590900	350257573614171	libre	ARGENTINA MARISOL - CEL: +5492212210746	4000.00	3000.00	disponible	2026-02-12 11:28:39	2026-02-13 16:11:27
17	IPHONE 14	128 GB	CELESTE	79	359388533920019	359388534192659	libre	ARGENTINO - CEL: +5491154165096	4590.00	4150.00	disponible	2026-02-12 13:01:50	2026-02-13 16:11:49
18	IPHONE 13 MINI	256 GB	ROSADO	86	358082909214906	358082909163665	libre	RUBEN ROMERO - CEL: 71816983	2000.00	3000.00	disponible	2026-02-13 14:24:55	2026-02-13 16:12:05
19	IPHONE 14	128 GB	AZUL MARINO	84	356094673371806	\N	libre	JUAN CELUS - CEL: +55 67 999184841	5000.00	4150.00	disponible	2026-02-13 14:28:12	2026-02-13 16:12:18
20	IPHONE 14	128 GB	AZUL MARINO	88	354776210545817	\N	libre	ARGENTINO - CEL: +5491154165096	5900.00	4150.00	disponible	2026-02-13 14:29:42	2026-02-13 16:12:31
21	IPHONE 14	128 GB	AZUL MARINO	87	350431270523999	\N	libre	MELISSA ARAUCO -CEL: 70359098	1500.00	4150.00	disponible	2026-02-13 14:30:53	2026-02-13 16:12:43
23	IPHONE 14 PLUS	256 GB	ROJO	84	359893879402159	359893879410830	libre	DANIELA - CEL: 60712044	4700.00	4700.00	disponible	2026-02-13 14:37:48	2026-02-13 16:13:08
24	IPHONE 15	128 GB	ROSADO	94	355260433517175	355260433705325	libre	GABRIEL LA PAZ	6750.00	4000.00	disponible	2026-02-13 14:39:12	2026-02-13 16:13:19
29	IPHONE 15 PRO MAX	256 GB	NATURAL	100	354570356029151	354570356548861	libre	CLIENTE - CEL: 67442174	8586.00	7000.00	disponible	2026-02-13 15:04:35	2026-02-13 16:14:22
32	IPHONE 16 PLUS	128 GB	BLANCO	92	358915824004391	358915822637119	libre	SAIDA SANCHEZ	9220.00	8000.00	disponible	2026-02-13 15:10:58	2026-02-13 16:15:15
7	IPHONE 12 PRO MAX	256 GB	AZUL	76	350002269634772	350002269730505	imei1_libre_imei2_registrado	RODRIGO MENDEZ CEL : 75916360	3100.00	3900.00	vendido	2026-02-04 19:59:53	2026-02-13 23:50:25
37	IPHONE 16 NORMAL	256 GB	ROSADO	100 SELLADO	357473862147830	357473862267513	libre	PLANET CELL	7871.00	8450.00	vendido	2026-02-14 00:10:34	2026-02-14 00:13:38
30	IPHONE 15 PRO MAX	512 GB	AZUL	90	351661827984661	351661828151559	libre	ARGENTINO - CEL: +5491154165096	10375.00	7900.00	vendido	2026-02-13 15:06:39	2026-03-09 19:59:18
34	REALME C35	128 GB	NEGRO	100	866456536776575	866563753476472	libre	KEVIN BOLAÑOS - CEL: 74454673	650.00	700.00	disponible	2026-02-13 15:16:38	2026-02-14 18:37:43
38	IPHONE 17 PRO MAX	256 GB	BLANCO	100 SELLADO	356605228913428	356605229052218	libre	JAIME JORDAN	12857.50	13800.00	vendido	2026-02-14 21:44:31	2026-02-14 21:58:24
39	IPHONE 17	256 GB	NEGRO	100 SELLADO	358372298554768	358372298682445	libre	JAIME JORDAN	8232.50	9400.00	vendido	2026-02-14 22:01:42	2026-02-14 22:04:45
40	IPHONE 16	128 GB	NEGRO	100 SELLADO	357473868669050	357473868577972	libre	PLANET CELL	6475.00	7300.00	vendido	2026-02-14 22:09:56	2026-02-14 22:15:54
6	IPHONE 12 PRO	128 GB	AZUL	76	350905823109091	350905823242561	libre	MAGALY ARNEZ	2000.00	2900.00	vendido	2026-02-04 19:55:25	2026-02-14 22:18:46
41	IPHONE 15	128 GB	CELESTE	100 SELLADO	354451586828128	354451586616473	libre	APPLE LAND	5920.00	6750.00	vendido	2026-02-15 21:16:58	2026-02-15 21:31:24
42	IPHONE 17	256 GB	LAVANDA	100	357779938624770	357779938851324	libre	JAIME JORDAN	8300.00	9620.00	vendido	2026-02-18 22:35:20	2026-02-18 22:45:21
36	PIXEL 8 PRO	128 GB	NEGRO	100	355522572982407	355522572982415	libre	CARLOS EEUU	3164.00	4300.00	vendido	2026-02-13 15:28:57	2026-02-20 13:03:07
43	IPHONE 17 PRO	256 GB	SILVER	100% SELLADO	358816654208245	358816654387510	libre	JAIME JORDAN	11625.00	12500.00	vendido	2026-02-18 22:37:01	2026-02-18 22:49:16
35	PIXEL 8 PRO	128 GB	NEGRO	100	358951612534562	358951612534570	libre	CARLOS EEUU	3164.00	4300.00	vendido	2026-02-13 15:19:11	2026-02-20 17:24:00
46	IPHONE 17 PRO MAX	256 GB	BLANCO	100	353314493868598	353314493939539	libre	ALEJANDRO SARAVIA	13100.00	13400.00	vendido	2026-02-23 10:05:41	2026-02-23 10:07:03
45	IPHONE 15 PRO MAX	1 TB	AZUL	89	358606716427457	358909716261161	libre	LOIDA DURAN CEL: 76077366	7100.00	7900.00	vendido	2026-02-18 22:43:21	2026-02-23 10:15:53
14	IPHONE XS MAX	256 GB	BLANCO	81	357282092990814	357282093069063	libre	Eber Cruz - Cel : 68750366	1200.00	1700.00	vendido	2026-02-11 10:28:42	2026-02-23 19:35:51
31	IPHONE 16	256 GB	AZUL	100	352181842897425	352181842576359	libre	MIGUEL CHAVEZ	7100.00	7500.00	vendido	2026-02-13 15:08:27	2026-02-24 19:57:22
33	IPHONE 16 PRO MAX	256 GB	NEGRO	100	359956460925662	359956460777022	libre	ERIK LUIS - CEL: 72588300	8800.00	9500.00	vendido	2026-02-13 15:12:32	2026-02-24 20:00:01
44	IPHONE 15	128 GB	VERDE	91	357394513319323	357394513425526	libre	ARIANA VILLEGAS CEL : 70719895	4500.00	5300.00	vendido	2026-02-18 22:39:56	2026-03-09 10:08:26
26	IPHONE 15	256 GB	NEGRO	89	353177646077437	353177645643726	libre	ARGENTINA MARISOL - CEL: +5492212210749	7075.00	5500.00	vendido	2026-02-13 14:43:12	2026-03-09 17:44:46
11	IPHONE 13 MINI	256 GB	AZUL MARINO	89	359251343340556	359251343364895	libre	CRISTIAN OPORTO 68383878	2739.00	3500.00	vendido	2026-02-05 20:09:58	2026-03-09 19:41:34
28	IPHONE 15 PRO	512 GB	NEGRO	86	354324417987704	354324419114752	libre	ENRIQUE SAAVEDRA - CEL: 69823248	8700.00	7200.00	vendido	2026-02-13 14:51:08	2026-03-09 20:00:24
16	IPHONE 13 MINI	128 GB	ROSADO	87	354852522191465	354852522335856	libre	RUBEN ROMERO - CEL: 71816983	2000.00	3000.00	vendido	2026-02-12 11:54:16	2026-03-16 19:43:01
5	IPHONE 11 PRO MAX	256 GB	DORADO	78	352840116176572	352840116148134	libre	KEVIN BOLA├æOS CEL: 74454673	2500.00	3000.00	vendido	2026-02-04 19:48:09	2026-03-16 19:47:28
25	IPHONE 15	128 GB	CELESTE	90	359282700635528	359282700675649	libre	CLIENTE	3700.00	4900.00	vendido	2026-02-13 14:41:09	2026-03-27 10:21:16
27	IPHONE 15 PRO	256 GB	NATURAL (CLISADO)	81	350832431067083	350832431250036	libre	ARGENTINA MARISOL  - CEL: +5492212210749	10500.00	6500.00	disponible	2026-02-13 14:49:05	2026-03-31 16:20:32
47	IPHONE 17 PRO MAX	256 GB	NARANJA	100	351771403018485	351771403213227	libre	EEUU	12123.00	13900.00	vendido	2026-03-09 10:56:15	2026-03-09 11:29:57
48	IPHONE 17 PRO MAX	256 GB	NARANJA	100	353763610428183	353763610164390	libre	EEUU	12123.00	13200.00	vendido	2026-03-09 11:07:51	2026-03-09 11:31:55
49	IPHONE 17 PRO MAX	256 GB	AZUL	100	350025973394060	350025973476867	libre	EEUU	12123.00	13200.00	vendido	2026-03-09 11:10:42	2026-03-09 11:31:55
52	IPHONE 15	256 GB	NEGRO	89	353177645643726	353177646077437	libre	ARGENTINA MARISOL +5492212210749	7075.00	5500.00	vendido	2026-03-09 19:22:39	2026-03-09 19:26:09
53	IPHONE 17 PRO MAX	256 GB	AZUL	100	353314494062993	353314494062266	libre	EEUU	12123.00	13200.00	vendido	2026-03-09 19:33:42	2026-03-09 19:39:18
54	IPHONE 11 PRO MAX	256 GB	DORADO	85	352844110079782	352844110218323	registrado	EDWIN YUCRA - CEL: 79371306	1000.00	2200.00	vendido	2026-03-09 19:46:23	2026-03-09 19:47:31
72	IPHONE 15 PRO MAX	512 GB	NEGRO	86	354379771236643	354379771352416	libre	EEUU	6469.00	7700.00	disponible	2026-04-01 10:25:14	2026-04-01 10:25:14
51	IPHONE 17 PRO MAX	256 GB	AZUL	100	358206134375667	358206134675736	libre	EEUU	13790.00	13700.00	vendido	2026-03-09 11:24:49	2026-03-09 19:51:40
50	IPHONE 17 PRO MAX	256 GB	AZUL	100	353314494074980	353314494052556	libre	EEUU	12123.00	13550.00	vendido	2026-03-09 11:17:02	2026-03-09 20:01:36
73	IPHONE 16 PRO MAX	256 GB	NEGRO	95	355706428090362	355706422730682	libre	EEUU	8042.21	9300.00	disponible	2026-04-01 10:40:19	2026-04-01 10:40:19
55	IPHONE 17	256 GB	NEGRO	100	357915798366934	000000000000000	libre	JUAN JOSE IRATE - CEL: 79336213	6624.00	9300.00	vendido	2026-03-09 19:56:19	2026-03-10 09:23:57
56	IPHONE 17	256 GB	LILA	100	350418056302540	350418055981989	libre	PIXEL DON JAIME	8370.00	9500.00	vendido	2026-03-17 09:50:42	2026-03-17 09:51:58
58	IPHONE 11	128 GB	VERDE	100	356314146936609	356314146901090	libre	MARIA INES MORALES - CEL: 70780240	1330.00	2400.00	disponible	2026-03-20 11:42:21	2026-03-20 11:42:21
74	IPHONE 16 PRO MAX	512 GB	NEGRO	91	355445523005955	355445526197841	libre	EEUU	8042.21	9300.00	disponible	2026-04-01 11:28:16	2026-04-01 11:28:16
75	PIXEL 9 PRO XL	256 GB	NEGRO	90	351582853219972	351582853219972	libre	EEUU	5462.72	6700.00	disponible	2026-04-01 11:31:58	2026-04-01 11:31:58
57	IPHONE 15	128 GB	CELESTE	100	355497937510195	355497937482155	libre	PIXEL DON JAIME	5985.00	7150.00	vendido	2026-03-20 11:40:37	2026-03-20 13:11:11
59	IPHONE 12 MINI	128 GB	VERDE	86	353526370909027	353526370909134	libre	ANTONELA PALOMINO - CEL: 76459234	1400.00	2298.00	disponible	2026-03-27 10:22:52	2026-03-27 10:22:52
60	IPHONE 15 PRO	256 GB	NEGRO	84	355407369618416	\N	libre	EEUU	5498.58	6400.00	vendido	2026-03-31 16:20:21	2026-03-31 16:27:22
76	PIXEL 9 PRO XL	256 GB	NEGRO	99	356858231420242	356858231420259	libre	EEUU	5462.81	6550.00	disponible	2026-04-01 11:34:21	2026-04-01 11:34:21
61	IPHONE 14 PRO MAX	512 GB	MORADO	84	350813226740969	350813226442905	libre	EEUU	5052.00	6500.00	vendido	2026-03-31 17:07:07	2026-03-31 17:12:08
62	IPHONE 12 PRO MAX	256 GB	DORADO	77	350408484250585	350408484444311	libre	ANAHI ROJAS	2200.00	3000.00	vendido	2026-03-31 17:23:06	2026-03-31 17:26:36
63	IPHONE 11	128 GB	BLANCO	74	350401983676566	350401983665056	libre	CLIENTA	750.00	1900.00	vendido	2026-03-31 17:44:08	2026-03-31 17:47:10
64	IPHONE 14 PRO	128 GB	MORADO	85	353115826794462	353115826526401	libre	EEUU AYE	3990.00	5200.00	vendido	2026-03-31 17:51:14	2026-03-31 17:54:24
65	IPHONE 15 PRO MAX	256 GB	NEGRO	91	352229496020404	352229496054734	libre	EEUU	5866.00	7300.00	vendido	2026-03-31 18:34:54	2026-03-31 18:46:18
66	IPHONE 11	128 GB	MORADO	86	353992105737630	353992105695317	libre	CLAUDIA ABASTO - CEL: 77915645	1000.00	2300.00	disponible	2026-04-01 09:38:26	2026-04-01 09:38:26
67	IPHONE 13 PRO MAX	256 GB	CELESTE	86	350419538099464	350419538592153	libre	EEUU	4187.54	5450.00	disponible	2026-04-01 09:47:15	2026-04-01 09:47:15
68	IPHONE 14 PRO	256 GB	MORADO	85	350308310033397	350308310385037	libre	EEUU	4381.37	5550.00	disponible	2026-04-01 10:12:14	2026-04-01 10:12:14
69	IPHONE 14 PRO	256 GB	NEGRO	86	356240875214019	356240876081045	libre	EEUU	4224.94	5549.00	disponible	2026-04-01 10:15:04	2026-04-01 10:15:04
70	IPHONE 15	128 GB	NEGRO	86	358355841387828	358355841414762	libre	EEUU	4008.82	5200.00	disponible	2026-04-01 10:17:37	2026-04-01 10:17:37
71	IPHONE 15 PRO MAX	256 GB	AZUL	88	354773168849168	354773168152118	libre	EEUU	6130.21	7400.00	disponible	2026-04-01 10:22:04	2026-04-01 10:22:04
77	PIXEL 10 PRO XL	256 GB	BLANCO	100	357006523535280	357006523535298	libre	EEUU	6802.24	9300.00	disponible	2026-04-01 11:46:10	2026-04-01 11:46:10
78	PIXEL 10 PRO XL	256 GB	NEGRO	100	357006521815981	357006521815999	libre	EEUU	7026.19	9300.00	disponible	2026-04-01 11:57:41	2026-04-01 11:57:41
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.clientes (id, user_id, nombre, telefono, correo, documento, created_at, updated_at) FROM stdin;
1	1	Belen Illanes	+59169474107	\N	\N	2026-01-31 18:19:03	2026-01-31 18:19:03
2	1	Gonzalo Mauricio Rojas Zabala	+591 70742485	\N	\N	2026-02-02 19:23:14	2026-02-02 19:23:14
3	1	Natalia Villarroel	+591 76999499	\N	\N	2026-02-02 19:32:01	2026-02-02 19:32:01
4	1	Limbert Mercado Abasto	+591 79787199	\N	\N	2026-02-02 19:33:24	2026-02-02 19:33:24
5	1	Waverley Software - Sucursal Bolivia	59176424612	rmunoz@waverleysoftware.com	\N	2026-02-03 15:51:33	2026-02-03 15:51:33
6	1	Erik Luis Tadeo	+591 72588300	\N	\N	2026-02-03 19:43:46	2026-02-03 19:43:46
7	1	Heber Garcia	+591 74166564	\N	\N	2026-02-04 12:07:05	2026-02-04 12:07:05
8	1	Wara Herbas	+591 69921625	\N	\N	2026-02-04 18:13:24	2026-02-04 18:13:24
9	1	Adrian Camacho	-	\N	\N	2026-02-04 19:36:50	2026-02-04 19:36:50
10	1	Paola Acosta Rodriguez	+591 75907425	\N	\N	2026-02-05 14:10:27	2026-02-05 14:10:27
11	3	Alejandro Ledezma	+591 69499736	\N	\N	2026-02-05 15:37:00	2026-02-05 15:37:00
12	1	JOYSI	73755464	\N	\N	2026-02-05 20:12:39	2026-02-05 20:12:39
13	1	Cristian Oporto Rodas	68383878	\N	\N	2026-02-05 20:14:35	2026-02-05 20:14:35
14	1	santiago abasto	59160358277	santy19abasto@gmail.com	\N	2026-02-06 18:29:53	2026-02-06 18:29:53
15	1	Angelica Pol	+591 77439811	\N	\N	2026-02-07 11:00:24	2026-02-07 11:00:24
16	1	Melisa Camacho	+591 79799800	\N	\N	2026-02-07 11:13:57	2026-02-07 11:13:57
17	1	Nicolas Pardo	+591 75955568	\N	\N	2026-02-07 12:44:13	2026-02-07 12:44:13
18	2	Lourdes Herrera	+591 60353124	\N	\N	2026-02-10 14:26:54	2026-02-10 14:26:54
19	1	Glenda Torrico	+591 60378633	\N	\N	2026-02-10 14:29:48	2026-02-10 14:29:48
20	1	Maria Celeste Gutierrez	+591 79257665	\N	\N	2026-02-10 14:34:41	2026-02-10 14:34:41
21	1	Mendoza	+591 76400695	\N	\N	2026-02-10 14:38:39	2026-02-10 14:38:39
22	1	Owen Lovera Zarate	+591 71846825	\N	\N	2026-02-10 14:40:26	2026-02-10 14:40:26
23	1	Ccantu Aroiste	+591 62709689	\N	\N	2026-02-10 14:41:56	2026-02-10 14:41:56
24	1	Alejandro Benjamin Torrez Apaza	+591 67935446	\N	\N	2026-02-11 10:24:34	2026-02-11 10:24:34
25	1	Eber Cruz	+591 68750366	\N	\N	2026-02-11 10:29:35	2026-02-11 10:29:35
26	1	Natalia Torrico	+591 69503773	\N	\N	2026-02-11 10:30:48	2026-02-11 10:30:48
27	1	Adm Cloud	59170276919	valetaborgacortez@gmail.com	\N	2026-02-13 06:00:06	2026-02-13 06:00:06
28	1	Jhoselin Sevillano	59176911358	notiene@gmail.com	\N	2026-02-13 06:12:53	2026-02-13 06:12:53
29	1	Mijail Pinchi Condori	+59175410132	\N	\N	2026-02-13 23:31:17	2026-02-13 23:31:17
30	1	Carlos Rodriguez	+5910	\N	\N	2026-02-13 23:34:32	2026-02-13 23:34:32
31	1	Matias Claure	+591 69469753	\N	\N	2026-02-13 23:50:25	2026-02-13 23:50:25
32	1	Lisbeth Cruces	+591 76482843	\N	\N	2026-02-13 23:55:09	2026-02-13 23:55:09
33	1	Dereck Alejandro Herbas	+591 68507342	\N	\N	2026-02-14 00:08:32	2026-02-14 00:08:32
34	1	Sofia Duarte	+595 973464565	\N	\N	2026-02-14 00:13:38	2026-02-14 00:13:38
35	1	Angelo Lima	+591 68350114	\N	\N	2026-02-14 00:20:43	2026-02-14 00:20:43
36	1	Claudia Abasto Lopez	+591 77915645	\N	\N	2026-02-14 00:26:50	2026-02-14 00:26:50
37	1	Samuel Eguino	+591 79776992	\N	\N	2026-02-14 21:42:16	2026-02-14 21:42:16
38	1	Gary Valeriano Quispe	+591 61606171	\N	\N	2026-02-14 21:58:24	2026-02-14 21:58:24
39	1	Gabriel Aranibar	+591 65380407	\N	\N	2026-02-14 22:04:45	2026-02-14 22:04:45
40	1	Ariel Abasto Cossio	+591 75472050	\N	\N	2026-02-14 22:08:30	2026-02-14 22:08:30
41	1	Andres Saavedra	+591 67430625	\N	\N	2026-02-14 22:15:54	2026-02-14 22:15:54
42	1	Angie Copa	+591 67470500	\N	\N	2026-02-14 22:18:46	2026-02-14 22:18:46
43	1	Adela Andrade	+591 79415788	\N	\N	2026-02-15 21:31:24	2026-02-15 21:31:24
44	1	Ariana Villegas	+591 70719895	\N	\N	2026-02-18 22:45:21	2026-02-18 22:45:21
45	1	Loida Duran	+591 76077366	\N	\N	2026-02-18 22:49:16	2026-02-18 22:49:16
46	1	Abdiel Antezana	+591 72281027	\N	\N	2026-02-20 13:00:03	2026-02-20 13:00:03
47	1	Rene Lazaro	+591 76463753	\N	\N	2026-02-20 13:01:23	2026-02-20 13:01:23
48	1	Rodrigo Delgado	+591 60719762	\N	\N	2026-02-20 13:03:07	2026-02-20 13:03:07
49	1	Nayra Coca	+591 60765033	\N	\N	2026-02-20 13:04:57	2026-02-20 13:04:57
50	1	Elvis Yapura	+591 64870957	\N	\N	2026-02-20 17:24:00	2026-02-20 17:24:00
51	1	Ricardo Zelaya	+591 74576666	\N	\N	2026-02-20 20:15:38	2026-02-20 20:15:38
52	1	Leandro Severiche	+591 78345472	\N	\N	2026-02-23 10:07:03	2026-02-23 10:07:03
53	1	Jennifer Yucra	+591 76902704	\N	\N	2026-02-23 10:13:38	2026-02-23 10:13:38
54	1	Jose Cayo Roque	+591 62661720	\N	\N	2026-02-23 10:15:53	2026-02-23 10:15:53
55	1	Isabel Pierola	+591 64309353	\N	\N	2026-02-23 10:17:04	2026-02-23 10:17:04
56	1	Maria Eduarda Gomes	+591 77442439	\N	\N	2026-02-23 19:35:51	2026-02-23 19:35:51
57	1	Sneyder Chirino	+591 76968031	\N	\N	2026-02-23 19:36:45	2026-02-23 19:36:45
58	1	Jayonne Camacho Rivera	+591 69542006	\N	\N	2026-02-23 19:39:58	2026-02-23 19:39:58
59	1	Jonathan Torrez	+591 75963943	\N	\N	2026-02-24 19:57:22	2026-02-24 19:57:22
60	1	Marcelo Viscarra	+591 75920060	\N	\N	2026-02-26 19:28:19	2026-02-26 19:28:19
61	1	Jhonny Mamani Velasquez	+591 75939001	\N	\N	2026-03-09 10:05:51	2026-03-09 10:05:51
62	1	Nicol Villarroel	+591 60728212	\N	\N	2026-03-09 10:08:26	2026-03-09 10:08:26
63	1	Anahi Rojas	+591 75479967	\N	\N	2026-03-09 11:29:57	2026-03-09 11:29:57
64	1	Ingrid Mercado	+591	\N	\N	2026-03-09 11:31:55	2026-03-09 11:31:55
65	1	Edwin Yucra Gutierrez	+591 79371306	\N	\N	2026-03-09 17:44:46	2026-03-09 17:44:46
66	1	Juan Carlos Eyzaguirre	+591 70740087	\N	\N	2026-03-09 19:39:18	2026-03-09 19:39:18
67	1	Richar Hinojosa Flores	+591 61355691	\N	\N	2026-03-09 19:41:34	2026-03-09 19:41:34
68	1	Gabriela Merino	+591 68428841	\N	\N	2026-03-09 19:47:31	2026-03-09 19:47:31
69	1	Sergio Caro	+591 67501906	\N	\N	2026-03-09 19:51:40	2026-03-09 19:51:40
70	1	Cristian Torrez Choque	+591 71428201	\N	\N	2026-03-09 19:59:18	2026-03-09 19:59:18
71	1	Ariel Vargas	+591 69473826	\N	\N	2026-03-09 20:00:24	2026-03-09 20:00:24
72	1	Alejandro Junior Ramirez	+591 71114484	\N	\N	2026-03-09 20:01:36	2026-03-09 20:01:36
73	1	Cristina Rojas	+591 74465176	\N	\N	2026-03-10 09:23:57	2026-03-10 09:23:57
74	1	Alejandro Olguin	+591 76986000	\N	\N	2026-03-10 19:05:09	2026-03-10 19:05:09
75	1	Jorge Galdo	+591 77702859	\N	\N	2026-03-13 19:23:22	2026-03-13 19:23:22
76	1	Jose Osvaldo Montero Caceres	+591 78805120	\N	\N	2026-03-16 19:43:01	2026-03-16 19:43:01
77	1	Vallejos	+591 75934926	\N	\N	2026-03-16 19:46:33	2026-03-16 19:46:33
78	1	Sebastian Mateo Parihuancollo	+591 60758067	\N	\N	2026-03-16 19:47:28	2026-03-16 19:47:28
79	1	Paola Perez	+591 72296222	\N	\N	2026-03-17 09:51:58	2026-03-17 09:51:58
80	1	Anticuario El Insomnio	+591 65331279	\N	\N	2026-03-17 19:10:10	2026-03-17 19:10:10
81	1	Dafne Luna Mendez	+591 75468828	\N	\N	2026-03-17 19:15:29	2026-03-17 19:15:29
82	1	Marcelo Catari	+591 67907352	\N	\N	2026-03-20 11:37:07	2026-03-20 11:37:07
83	1	Maria Ines Morales	+591 70780240	\N	\N	2026-03-20 13:11:11	2026-03-20 13:11:11
84	1	Maria Choque	+591 77493181	\N	\N	2026-03-23 09:34:58	2026-03-23 09:34:58
85	1	Mijael Reyes	+591 73803531	\N	\N	2026-03-23 09:43:09	2026-03-23 09:43:09
86	1	Antonela Palomino	+591 76459234	\N	\N	2026-03-27 10:21:16	2026-03-27 10:21:16
87	1	Maira Sanjines	+591 79678871	\N	\N	2026-03-27 10:34:57	2026-03-27 10:34:57
88	1	Kelly Salcedo	+591 76443533	\N	\N	2026-03-31 16:27:22	2026-03-31 16:27:22
89	1	Adriana Dorado	+591 60771838	\N	\N	2026-03-31 16:48:01	2026-03-31 16:48:01
90	1	Ronald Saavedra	+591 78570125	\N	\N	2026-03-31 16:57:12	2026-03-31 16:57:12
91	1	Johnny Suarez	+591 75985105	\N	\N	2026-03-31 17:12:08	2026-03-31 17:12:08
92	1	Ricardo Aviles	+591 70345444	\N	\N	2026-03-31 17:16:03	2026-03-31 17:16:03
93	1	Rodrigo Calvimontes	+591 71485098	\N	\N	2026-03-31 17:26:36	2026-03-31 17:26:36
94	1	Mireya Escobar	+591 67496621	\N	\N	2026-03-31 17:39:55	2026-03-31 17:39:55
95	1	Michelle Ramos	+591 60362820	\N	\N	2026-03-31 17:47:10	2026-03-31 17:47:10
96	1	Camila Shanik Colque Sandy	+591 71762884	\N	\N	2026-03-31 17:54:24	2026-03-31 17:54:24
97	1	Yadhira Llanos Saavedra	+591 67335457	\N	\N	2026-03-31 17:57:46	2026-03-31 17:57:46
98	1	Carlos Marin	+591 60366036	\N	\N	2026-03-31 18:04:00	2026-03-31 18:04:00
99	1	Johann Pereira Molina	+591 60713021	\N	\N	2026-03-31 18:46:18	2026-03-31 18:46:18
100	1	Samira Nuñez Antezana	+591 67466816	\N	\N	2026-03-31 19:24:22	2026-03-31 19:24:22
101	1	Jorge Villegas	69463010	\N	\N	2026-03-31 19:25:43	2026-03-31 19:25:43
102	1	FABOCE	59171734261	aaguilar@faboce.com.bo	\N	2026-04-01 16:58:45	2026-04-01 16:58:45
\.


--
-- Data for Name: computadoras; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.computadoras (id, numero_serie, nombre, procesador, bateria, color, ram, almacenamiento, procedencia, precio_costo, precio_venta, estado, created_at, updated_at) FROM stdin;
1	F79W2QQJL7	MACBOOK AIR	M3	100	PLATA	16	256 GB	EEUU CARLOS	8767.00	9000.00	vendido	2026-02-04 12:05:18	2026-02-04 12:07:05
2	C02FMA2LQ05D	MACBOOK PRO	M1	95	PLATA	8	256 GB	CARLOS EEUU	5600.00	6500.00	vendido	2026-02-07 10:57:31	2026-02-07 11:00:24
3	JHW5L6MCW6	MACBOOK AIR 15 PULGADAS	M3	100	AZUL	8	512 GB	CARLOS EEUU	7000.00	9000.00	vendido	2026-02-07 10:59:25	2026-02-07 11:13:57
5	DWQ5F6RNQX	MACBOOK AIR 15"	M4	100	PLATA	16	256 GB	CARLOS EEUU	10363.00	12500.00	disponible	2026-02-13 16:20:50	2026-02-13 16:21:27
6	C02WL02GHH22	MACBOOK RETINA 2017	iCORE i5	308 CICLOS	PLATA	8	512 GB	THAIS REIS	3014.00	4200.00	disponible	2026-02-13 16:26:08	2026-02-13 16:26:08
7	FVFZ5CW7L410	MACBOOK PRO 2019	iCORE i5	149 CICLOS	PLATA	8	256 GB	CLIENTE	4900.00	5900.00	disponible	2026-02-13 16:29:55	2026-02-13 16:30:20
8	C02G616JML7H	MACBOOK PRO 2020	iCORE i5	1048 CICLOS	PLATA	8	512 GB	THAIS REIS	3500.00	5000.00	disponible	2026-02-13 16:31:48	2026-02-13 16:31:48
9	DJVWGF5FC6	MACBOOK PRO	M3 PRO	100	PLATA	18	512	CARLOS EEUU	12927.00	18500.00	disponible	2026-02-13 16:33:44	2026-02-13 16:33:44
10	MPZEFV9L	LENOVO IDEAPAD GAMING 3	RYZEN 7	100	NEGRO	16	512 GB	CLIENTE	8600.00	8000.00	disponible	2026-02-13 16:42:19	2026-02-13 16:42:19
12	C0268030Q05G	MACBOOK PRO	M1	97	PLATA	8	256 GB	CARLOS EEUU	5600.00	6200.00	vendido	2026-02-13 23:29:25	2026-02-13 23:31:17
13	2791BF50B094180A5B8CF7008D8DA17	ASUS ROG STRIX	AMD RYZEN 8940HX WITH RADEON GRAPHICS	100	GRISS	32	2 TB	GARY VALERIANO QUISPE CEL : 61606171	16100.00	18900.00	vendido	2026-02-14 21:36:24	2026-02-20 13:01:23
11	HHPFQ0VWQN	MAC MINI	M4	100	BLANCO	16	256 GB	CARLOS EEUU	5225.50	7500.00	vendido	2026-02-13 17:52:55	2026-02-26 19:28:19
14	JR04C7V67P	MACBOOK PRO	M5	100	NEGRO	16	512 GB	CARLOS EEUU	17025.00	17100.00	vendido	2026-03-10 19:03:57	2026-03-10 19:05:09
15	NHU1PAA00453024AD07600	ACER NITRO V15	i5	100	NEGRO	16	512 GB	CARLOS EE	7047.50	7450.00	vendido	2026-03-12 19:29:38	2026-03-12 19:30:53
4	FYFWKL3VYT	MACBOOK AIR 13"	M3	100	GRIS	8	256 GB	CARLOS EEUU	8390.00	9500.00	vendido	2026-02-13 16:09:45	2026-03-20 11:37:07
16	H717G43L6V	MACBOOK PRO	M5 PRO	100	NEGRO	24	512 GB	EEUU	19540.00	22900.00	vendido	2026-03-31 17:56:40	2026-03-31 17:57:46
17	D7R16G7W27	MACBOOK NEO	\N	100	ROSA	8	256	CARLOS EEUU	7162.00	7950.00	vendido	2026-03-31 19:22:14	2026-03-31 19:24:22
\.


--
-- Data for Name: cotizaciones; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.cotizaciones (id, user_id, cliente_id, nombre_cliente, telefono, correo_cliente, items, descuento, total, drive_url, notas_adicionales, fecha_cotizacion, enviado_por_correo, enviado_por_whatsapp, created_at, updated_at) FROM stdin;
4	1	28	Jhoselin Sevillano	59176911358	notiene@gmail.com	[{"nombre":"Apple Laptop MacBook Pro 2025 con chip M5 con CPU de 10 n\\u00facleos y GPU de 10 n\\u00facleos: dise\\u00f1ada para Apple Intelligence, pantalla Liquid Retina XDR de 14.2 pulgadas, memoria unificada de 16 GB","cantidad":1,"precio_sin_factura":19900,"descuento":0,"iva":2587,"it":597,"total":23084},{"nombre":"Apple Laptop MacBook Pro 2024 con M4 Pro, CPU de 12 n\\u00facleos, GPU de 16 n\\u00facleos: dise\\u00f1ada para Apple Intelligence, pantalla Liquid Retina XDR de 14.2 pulgadas, memoria unificada de 24 GB","cantidad":1,"precio_sin_factura":28500,"descuento":0,"iva":3705,"it":855,"total":33060}]	0.00	56144.00	https://drive.google.com/file/d/14w5atrAOAOkw5LGX0XJjL6iAHvECUNF9/view	Garantia 1 a├▒o.	2026-02-13	t	f	2026-02-13 06:12:53	2026-02-13 06:13:00
1	1	5	Waverley Software - Sucursal Bolivia	59176424612	rmunoz@waverleysoftware.com	[{"nombre":"MACBOOK PRO M4 PRO CON 24 GB DE MEMORIA RAM","cantidad":1,"precio_sin_factura":22015,"descuento":0,"iva":2861.95,"it":660.45,"total":25537.4},{"nombre":"MACBOOK PRO M5 PRO CON 24 GB DE MEMORIA RAM","cantidad":1,"precio_sin_factura":20690,"descuento":0,"iva":2689.7,"it":620.7,"total":24000.4}]	0.00	49537.80	https://drive.google.com/file/d/1ST2hsihFonb1hAeL-n64vWVwWT7S6_p4/view	NUEVO SELLADO UN A├æO DE GARANTIA , ITEMS SEPARADOS.	2026-02-03	t	f	2026-02-03 15:51:33	2026-02-03 15:51:43
2	1	14	santiago abasto	59160358277	santy19abasto@gmail.com	[{"nombre":"IPHONE XR","cantidad":1,"precio_sin_factura":1500,"descuento":0,"iva":195,"it":45,"total":1740}]	0.00	1740.00	https://drive.google.com/file/d/1ErzFGIvS4HOW_V6kvmaoSB1EICE9Ykq_/view	dolar paralelo	2026-02-06	t	f	2026-02-06 18:29:53	2026-02-06 18:30:09
3	1	27	Adm Cloud	59170276919	valetaborgacortez@gmail.com	[{"nombre":"iPhone 16 128GB \\u2013 Nuevo Sellado en Caja","cantidad":1,"precio_sin_factura":7400,"descuento":0,"iva":962,"it":222,"total":8584},{"nombre":"iPhone 16 256GB \\u2013 Nuevo Sellado en Caja","cantidad":1,"precio_sin_factura":8400,"descuento":0,"iva":1092,"it":252,"total":9744},{"nombre":"iPhone 16 128GB \\u2013 Seminuevo en Excelente Estado - Bateria 100%","cantidad":1,"precio_sin_factura":7500,"descuento":0,"iva":975,"it":225,"total":8700}]	0.00	27028.00	https://drive.google.com/file/d/1uTuQXMslJZyGV9-2ly1aYGpnWIoTjYSg/view	Ofrecemos iPhone 16 disponibles en versi├│n sellada y seminueva:\n\nÔÇó iPhone 16 128GB Sellado ÔÇô Bs 7.400 (1 a├▒o de garant├¡a)\nÔÇó iPhone 16 256GB Sellado ÔÇô Bs 8.400 (1 a├▒o de garant├¡a)\nÔÇó iPhone 16 128GB Seminuevo ÔÇô Bs 7.500 (3 meses de garant├¡a)\n\nEquipos originales, verificados y listos para entrega inmediata.\nGarant├¡a real por funcionamiento.	2026-02-13	t	f	2026-02-13 06:00:06	2026-02-13 06:00:14
5	1	102	FABOCE	59171734261	aaguilar@faboce.com.bo	[{"nombre":"IPHONE 15 PRO MAX","cantidad":1,"precio_sin_factura":7400,"descuento":382.76,"iva":912.24,"it":210.52,"total":8140},{"nombre":"IPHONE 15 PRO","cantidad":1,"precio_sin_factura":7100,"descuento":367.24,"iva":875.26,"it":201.98,"total":7810},{"nombre":"IPHONE 15 PRO 256GB","cantidad":1,"precio_sin_factura":6800,"descuento":351.72,"iva":838.28,"it":193.45,"total":7480.01}]	0.00	23430.01	https://drive.google.com/file/d/1sSy1vwOhJAlmgTyPCbchxQuu5hy85vZi/view		2026-04-01	t	f	2026-04-01 16:58:45	2026-04-01 16:58:57
\.


--
-- Data for Name: egresos; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.egresos (id, concepto, precio_invertido, tipo_gasto, frecuencia, cuotas_pendientes, comentario, user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
\.


--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2025_05_05_143746_add_rol_to_users_table	1
5	2025_05_05_151448_create_celulars_table	1
6	2025_05_05_151939_create_producto_generals_table	1
7	2025_05_05_152010_create_computadoras_table	1
8	2025_05_05_194104_create_ventas_table	1
9	2025_05_05_203216_create_servicio_tecnicos_table	1
10	2025_05_09_110702_create_clientes_table	1
11	2025_05_24_234700_create_cotizaciones_table	1
12	2025_05_31_130322_create_ventas_items_table	1
13	2025_06_01_171426_add_valor_permuta_to_ventas_table	1
14	2025_06_03_204745_create_productos_apple_table	1
15	2025_06_04_001727_add_entregado_producto_apple_id_to_ventas_table	1
16	2025_06_10_110612_create_promociones_enviadas_table	1
17	2025_06_12_122858_add_cliente_id_to_servicio_tecnicos_table	1
18	2025_07_07_110159_create_egresos_table	1
19	2026_01_05_083920_create_secuencias_table	1
20	2026_01_22_155205_create_automation_reports_table	1
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
\.


--
-- Data for Name: productos_apple; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.productos_apple (id, modelo, capacidad, bateria, color, numero_serie, procedencia, precio_costo, precio_venta, tiene_imei, imei_1, imei_2, estado_imei, estado, created_at, updated_at) FROM stdin;
1	AIRPODS PRO 3	-	100	Blanco	FFWN4W7FYM	CARLOS EEUU	2300.00	2900.00	f	\N	\N	\N	vendido	2026-02-04 19:25:57	2026-02-05 15:37:00
2	PENCIL USB -C	-	-	BLANCO	GYQJJT219G	SONIA APPLE LAND	916.00	1200.00	f	\N	\N	\N	vendido	2026-02-10 14:18:27	2026-02-10 14:26:54
3	PENCIL USB -C	-	-	BLANCO	C2Q52FP12J	SONIA APPLE LAND	916.00	1200.00	f	\N	\N	\N	vendido	2026-02-10 14:19:09	2026-02-10 14:26:54
4	PENCIL PRO	-	-	BLANCO	HD4T7FVYC6	SONIA APPLE LAND	1236.60	1520.00	f	\N	\N	\N	vendido	2026-02-10 14:29:09	2026-02-10 14:29:48
5	PENCIL 2DA GEN	-	-	BLANCO	H9DNTKCZJKM9	JAIME JORDAN	1007.60	1400.00	f	\N	\N	\N	vendido	2026-02-10 14:39:51	2026-02-10 14:40:26
6	IPAD MINI 7MA GEN.	128 GB	100	PLATA	N432VC9QFP	CLIENTE	7500.00	6500.00	f	\N	\N	\N	disponible	2026-02-13 16:58:31	2026-02-13 16:58:31
9	AIRPODS 1RA GEN.	-	90	BLANCO	\N	DIEGO ROJAS CASTRO - CEL: 70777088	400.00	450.00	f	\N	\N	\N	disponible	2026-02-13 17:56:06	2026-02-13 17:56:06
10	IWATCH SERIE 10 DE 46MM	64 GB	100	NEGRO	M4T43W4RY1	SEBAS	2660.00	3200.00	f	\N	\N	\N	disponible	2026-02-13 18:42:56	2026-02-13 18:42:56
11	IWATCH SERIE 10 DE 46MM + LTE	64 GB	100	NEGRO	K5WNFQ92RK	CARLOS EEUU	3181.00	3600.00	t	358076159903101	-	Libre	disponible	2026-02-13 23:25:35	2026-02-13 23:26:13
15	SAMSUNG GALAXY TAB S10 LITE 5G	128 GB	100	NEGRO	R5GYA0V7KSY	DERECK ALEJANDRO CEL : 68507342	3206.00	4200.00	t	359592142171043	\N	Libre	disponible	2026-02-14 00:06:29	2026-02-14 00:06:42
14	AIRPODS 4TA GEN	-	100 SELLADO	BLANCO	LK33NLK9T6	HELDON	1666.80	2106.80	f	\N	\N	\N	vendido	2026-02-14 00:03:07	2026-02-14 00:08:32
12	IPAD A16	128 GB	100 SELLADO	AZUL	JH9R14VWCL	HELDON	3889.20	4625.80	f	\N	\N	\N	vendido	2026-02-14 00:00:03	2026-02-14 00:08:32
13	APPLE PENCIL USB - C	-	100 SELLADO	BLANCO	D2VW634LPG	HELDON	1018.60	1282.40	f	\N	\N	\N	vendido	2026-02-14 00:01:55	2026-02-14 00:08:32
16	IWATCH SERIES 10 46MM CON LTE	64 GB	100	BLANCO	JHYASFYUW76	CARLOS EEUU	3181.36	3600.00	t	353535584548415	\N	Libre	vendido	2026-02-14 00:19:43	2026-02-14 00:20:43
7	IPAD PRO M4 + PENCIL	256 GB	100	NEGRO	KJK91L2MRY	JUNIOR ABASTO	10720.00	11900.00	f	\N	\N	\N	vendido	2026-02-13 17:00:31	2026-02-14 21:42:16
8	GALAXY TAB S9 ULTRA	256 GB	100	NEGRO	R52W8049EMX	CAMILO JALDIN - CEL: 70762096	6900.00	7000.00	f	\N	\N	\N	vendido	2026-02-13 17:10:37	2026-03-13 19:23:22
17	AIRPODS PRO 2DA GEN.	-	100	BLANCO	TKXD4307C1	SANTI STORE	180.00	250.00	f	\N	\N	\N	vendido	2026-03-13 10:03:22	2026-03-27 10:31:55
18	IPAD A16 WIFI	256 GB	100	AZUL	K6PVJ165FH	JAIME PIXEL	4834.30	5989.00	f	\N	\N	\N	vendido	2026-03-31 17:28:30	2026-03-31 17:39:55
\.


--
-- Data for Name: productos_generales; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.productos_generales (id, codigo, tipo, nombre, procedencia, precio_costo, precio_venta, estado, created_at, updated_at) FROM stdin;
1	VIDRIO: 1	vidrio_templado	Vidrio Templado iphone 7/8 Plus	GZ STORES	10.00	40.00	disponible	2026-01-31 10:47:25	2026-01-31 10:47:25
2	VIDRIO: 2	vidrio_templado	Vidrio Templado iphone 7/8 Plus	GZ STORES	10.00	45.00	disponible	2026-01-31 10:47:57	2026-01-31 10:47:57
3	VIDRIO_ANTIES_6	vidrio_templado	Vidrio Templado IP12/12PRO	GZ STORES	12.00	50.00	disponible	2026-01-31 10:53:00	2026-01-31 10:53:00
4	VIDRIO: 39	vidrio_templado	Vidrio Templado IP 12 PRO MAX	GZ STORES`	10.00	40.00	disponible	2026-01-31 10:55:15	2026-01-31 10:55:15
5	VIDRIO: 43	vidrio_templado	Vidrio Templado IP 12 PRO MAX	GZ STORES	10.00	40.00	disponible	2026-01-31 10:56:51	2026-01-31 10:56:51
8	VIDRIO: 61	vidrio_templado	Vidrio Templado AntiBlue light IP 13 PRO	GZ STORES	10.00	40.00	disponible	2026-01-31 11:03:55	2026-01-31 11:03:55
6	VIDRIO: 50	vidrio_templado	Vidrio Templado AntiBlue light IP 12 PRO MAX	GZ STORES	12.00	40.00	disponible	2026-01-31 11:02:11	2026-01-31 11:04:14
9	Vidrio:74	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:08:25	2026-01-31 11:08:25
10	Vidrio:60	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:08:41	2026-01-31 11:08:41
11	Vidrio:57	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:09:05	2026-01-31 11:09:05
12	Vidrio:54	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:09:25	2026-01-31 11:09:25
13	Vidrio:61	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:09:46	2026-01-31 11:09:46
14	Vidrio:66	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:10:17	2026-01-31 11:10:17
15	Vidrio:67	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:11:02	2026-01-31 11:11:02
16	Vidrio:75	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:11:23	2026-01-31 11:11:23
17	Vidrio:73	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:11:41	2026-01-31 11:11:41
18	Vidrio:56	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:11:56	2026-01-31 11:11:56
19	Vidrio:64	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:12:12	2026-01-31 11:12:12
21	Vidrio:62	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:13:19	2026-01-31 11:13:19
22	Vidrio:69	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:13:45	2026-01-31 11:13:45
23	Vidrio:68	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:14:32	2026-01-31 11:14:32
24	Vidrio:72	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:14:53	2026-01-31 11:14:53
25	Vidrio:65	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:15:10	2026-01-31 11:15:10
26	Vidrio:63	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:15:44	2026-01-31 11:15:44
27	Vidrio:58	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:16:40	2026-01-31 11:16:40
28	Vidrio:49	vidrio_templado	Vidrio Templado IP 12 Pro Max	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:17:03	2026-01-31 11:17:03
29	Vidrio:52	vidrio_templado	Vidrio Templado IP 12 Pro Max	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:17:19	2026-01-31 11:17:19
30	Vidrio:53	vidrio_templado	Vidrio Templado IP 12 Pro Max	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:17:38	2026-01-31 11:17:38
31	Vidrio:27	vidrio_templado	Vidrio Templado IP 12 Pro Max	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:17:54	2026-01-31 11:17:54
32	Vidrio:46	vidrio_templado	Vidrio Templado IP 12 Pro Max	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:18:11	2026-01-31 11:18:11
33	Vidrio:35	vidrio_templado	Vidrio Templado IP 12/12 PRO	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:18:38	2026-01-31 11:18:38
34	Vidrio:36	vidrio_templado	Vidrio Templado IP12/12PRO	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:19:07	2026-01-31 11:19:07
35	Vidrio:40	vidrio_templado	Vidrio Templado IP12/12PRO	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:19:50	2026-01-31 11:19:50
36	Vidrio:37	vidrio_templado	Vidrio Templado IP12/12PRO	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:20:17	2026-01-31 11:20:17
37	Vidrio:28	vidrio_templado	Vidrio Templado IP XSMAX/11 PRO MAX	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:21:34	2026-01-31 11:21:34
38	Vidrio:29	vidrio_templado	Vidrio Templado IP XSMAX/11 PRO MAX	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:21:49	2026-01-31 11:21:49
39	Vidrio:26	vidrio_templado	Vidrio Templado IP XSMAX/11 PRO MAX	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:22:14	2026-01-31 11:22:14
40	Vidrio:31	vidrio_templado	Vidrio Templado IP XSMAX/11 PRO MAX	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:22:38	2026-01-31 11:22:38
41	Vidrio:23	vidrio_templado	Vidrio Templado IP XSMAX/11 PRO MAX	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:23:05	2026-01-31 11:23:05
42	Vidrio:24	vidrio_templado	Vidrio Templado IP XSMAX/11 PRO MAX	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:23:29	2026-01-31 11:23:29
43	Vidrio:11	vidrio_templado	Vidrio Templado IP XS / X / 11 PRO	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:25:43	2026-01-31 11:25:43
44	Vidrio:12	vidrio_templado	Vidrio Templado IP XR / 11	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:27:30	2026-01-31 11:27:30
45	Vidrio:14	vidrio_templado	Vidrio Templado IP XR / 11	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:28:24	2026-01-31 11:28:24
46	Vidrio:16	vidrio_templado	Vidrio Templado IP XR / 11	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:28:59	2026-01-31 11:28:59
47	Vidrio:13	vidrio_templado	Vidrio Templado IP XR / 11	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:30:48	2026-01-31 11:31:05
48	VIDRIOTEMCA:4	vidrio_templado	Vidrio Templado Anti-Glare IP XS MAX / 11 PRO MAX	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:54:44	2026-01-31 11:54:44
49	VIDRIOTEMCA:3	vidrio_templado	Vidrio Templado Anti-Glare IP XS MAX / 11 PRO MAX	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:54:57	2026-01-31 11:54:57
50	VIDRIOTEMCA:2	vidrio_templado	Vidrio Templado Glass IP XS MAX / 11 PRO MAX	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:55:34	2026-01-31 11:55:34
51	VIDRIOTEMCA:1	vidrio_templado	Vidrio Templado Anti-Glare IP 13 PRO	CARLOS EEUU	11.00	40.00	disponible	2026-01-31 11:55:56	2026-01-31 11:55:56
52	VIDRIOTEMSA:1	vidrio_templado	Vidrio Templado IP 7/8	GZ STORES	11.00	40.00	disponible	2026-01-31 12:07:33	2026-01-31 12:07:33
53	VIDRIOTEMSA:2	vidrio_templado	Vidrio Templado IP XR/11	GZ STORES	11.00	40.00	disponible	2026-01-31 12:08:06	2026-01-31 12:08:06
54	VIDRIOTEMSA:3	vidrio_templado	Vidrio Templado IP XR/11	GZ STORES	11.00	40.00	disponible	2026-01-31 12:08:25	2026-01-31 12:08:25
55	VIDRIOTEMSA:4	vidrio_templado	Vidrio Templado IP XR/11	GZ STORES	11.00	40.00	disponible	2026-01-31 12:08:44	2026-01-31 12:08:44
7	VIDRIO: 51	vidrio_templado	Vidrio Templado IP 13 Mini	GZ STORES	10.00	40.00	vendido	2026-01-31 11:03:21	2026-03-16 19:43:01
57	VIDRIOTEMSA:6	vidrio_templado	Vidrio Templado IP XR/11	GZ STORES	11.00	40.00	disponible	2026-01-31 12:09:18	2026-01-31 12:09:18
58	VIDRIOTEMSA:7	vidrio_templado	Vidrio Templado IP XR/11	GZ STORES	11.00	40.00	disponible	2026-01-31 12:09:53	2026-01-31 12:09:53
59	VIDRIOTEMSA:8	vidrio_templado	Vidrio Templado IP XR/11	GZ STORES	11.00	40.00	disponible	2026-01-31 12:10:10	2026-01-31 12:10:10
60	VIDRIOTEMSA:9	vidrio_templado	Vidrio Templado IP XR/11	GZ STORES	11.00	40.00	disponible	2026-01-31 12:10:31	2026-01-31 12:10:31
61	VIDRIOTEMSA:10	vidrio_templado	Vidrio Templado IP X/XS/11PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:11:01	2026-01-31 12:11:01
63	VIDRIOTEMSA:12	vidrio_templado	Vidrio Templado IP X/XS/11PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:11:44	2026-01-31 12:11:44
64	VIDRIOTEMSA:13	vidrio_templado	Vidrio Templado IP X/XS/11PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:14:34	2026-01-31 12:14:34
65	VIDRIOTEMSA:14	vidrio_templado	Vidrio Templado IP X/XS/11PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:15:45	2026-01-31 12:15:45
66	VIDRIOTEMSA:15	vidrio_templado	Vidrio Templado IP X/XS/11PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:16:13	2026-01-31 12:16:13
67	VIDRIOTEMSA:29	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:20:08	2026-01-31 12:20:08
68	VIDRIOTEMSA:28	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:20:34	2026-01-31 12:20:34
69	VIDRIOTEMSA:27	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:20:59	2026-01-31 12:20:59
70	VIDRIOTEMSA:26	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:21:14	2026-01-31 12:21:14
72	VIDRIOTEMSA:24	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:21:49	2026-01-31 12:21:49
74	VIDRIOTEMSA:22	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	8.00	30.00	disponible	2026-01-31 12:22:34	2026-01-31 12:22:34
75	VIDRIOTEMSA:21	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	8.00	30.00	disponible	2026-01-31 12:22:47	2026-01-31 12:22:47
76	VIDRIOTEMSA:20	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	8.00	30.00	disponible	2026-01-31 12:23:02	2026-01-31 12:23:02
77	VIDRIOTEMSA:19	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	8.00	30.00	disponible	2026-01-31 12:23:27	2026-01-31 12:23:27
78	VIDRIOTEMSA:18	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	8.00	30.00	disponible	2026-01-31 12:23:48	2026-01-31 12:23:48
79	VIDRIOTEMSA:17	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:24:05	2026-01-31 12:24:05
1231	FUNDAS_DIS_174	funda	FUNDA DE SILICONA IP 11 PRO MAX	CHINA	20.00	60.00	disponible	2026-02-16 13:20:22	2026-02-16 13:20:22
83	VIDRIOTEMSA:32	vidrio_templado	Vidrio Templado IP 12 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:27:35	2026-01-31 12:27:35
84	VIDRIOTEMSA:31	vidrio_templado	Vidrio Templado IP 12 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:28:05	2026-01-31 12:28:05
85	VIDRIOTEMSA:30	vidrio_templado	Vidrio Templado IP 12 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:28:17	2026-01-31 12:28:17
86	VIDRIOTEMSA:38	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	8.00	30.00	disponible	2026-01-31 12:32:37	2026-01-31 12:32:37
87	VIDRIOTEMSA:37	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	11.00	30.00	disponible	2026-01-31 12:32:55	2026-01-31 12:32:55
88	VIDRIOTEMSA:36	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	8.00	30.00	disponible	2026-01-31 12:33:13	2026-01-31 12:33:13
89	VIDRIOTEMSA:35	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:33:34	2026-01-31 12:33:34
90	VIDRIOTEMSA:46	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:33:46	2026-01-31 12:33:46
92	VIDRIOTEMSA:44	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:34:14	2026-01-31 12:34:14
93	VIDRIOTEMSA:43	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:34:25	2026-01-31 12:34:25
94	VIDRIOTEMSA:42	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:34:35	2026-01-31 12:34:35
96	VIDRIOTEMSA:40	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:34:59	2026-01-31 12:34:59
97	VIDRIOTEMSA:39	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:35:11	2026-01-31 12:35:11
99	VIDRIOTEMSA:58	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:39:39	2026-01-31 12:39:39
100	VIDRIOTEMSA:57	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:39:51	2026-01-31 12:39:51
101	VIDRIOTEMSA:56	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:40:02	2026-01-31 12:40:02
103	VIDRIOTEMSA:54	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:40:26	2026-01-31 12:40:26
104	VIDRIOTEMSA:53	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:40:39	2026-01-31 12:40:39
107	VIDRIOTEMSA:50	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:43:02	2026-01-31 12:43:02
108	VIDRIOTEMSA:49	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:44:26	2026-01-31 12:44:26
109	VIDRIOTEMSA:48	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:44:36	2026-01-31 12:44:36
110	VIDRIOTEMSA:47	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 12:44:49	2026-01-31 12:44:49
95	VIDRIOTEMSA:41	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 12:34:47	2026-02-04 18:13:24
71	VIDRIOTEMSA:25	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 12:21:32	2026-02-15 21:31:24
91	VIDRIOTEMSA:45	vidrio_templado	Vidrio Templado IP 13/13PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 12:34:00	2026-02-24 19:58:48
56	VIDRIOTEMSA:5	vidrio_templado	Vidrio Templado IP XR/11	GZ STORES	11.00	40.00	vendido	2026-01-31 12:09:01	2026-03-09 19:39:58
73	VIDRIOTEMSA:23	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 12:22:11	2026-03-09 19:43:49
106	VIDRIOTEMSA:51	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 12:42:12	2026-03-31 17:12:46
81	VIDRIOTEMSA:34	vidrio_templado	Vidrio Templado IP 12 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 12:27:04	2026-03-31 17:20:34
82	VIDRIOTEMSA:33	vidrio_templado	Vidrio Templado IP 12 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 12:27:21	2026-03-31 17:26:36
102	VIDRIOTEMSA:55	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 12:40:15	2026-03-31 17:26:36
112	VIDRIOTEMSA:67	vidrio_templado	Vidrio Templado IP 13/14	GZ STORES	11.00	40.00	disponible	2026-01-31 12:48:21	2026-01-31 12:48:21
114	VIDRIOTEMSA:65	vidrio_templado	Vidrio Templado IP 13/14	GZ STORES	11.00	40.00	disponible	2026-01-31 12:48:48	2026-01-31 12:48:48
115	VIDRIOTEMSA:64	vidrio_templado	Vidrio Templado IP 13/14	GZ STORES	11.00	40.00	disponible	2026-01-31 12:49:04	2026-01-31 12:49:04
117	VIDRIOTEMSA:62	vidrio_templado	Vidrio Templado IP 13/14	GZ STORES	11.00	40.00	disponible	2026-01-31 12:49:51	2026-01-31 12:49:51
118	VIDRIOTEMSA:61	vidrio_templado	Vidrio Templado IP 13/14	GZ STORES	11.00	40.00	disponible	2026-01-31 12:50:04	2026-01-31 12:50:04
119	VIDRIOTEMSA:60	vidrio_templado	Vidrio Templado IP 13/14	GZ STORES	11.00	40.00	disponible	2026-01-31 12:50:16	2026-01-31 12:50:16
120	VIDRIOTEMSA:75	vidrio_templado	Vidrio Templado IP 14 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:52:22	2026-01-31 12:52:22
122	VIDRIOTEMSA:73	vidrio_templado	Vidrio Templado IP 14PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:52:51	2026-01-31 12:52:51
124	VIDRIOTEMSA:71	vidrio_templado	Vidrio Templado IP 14PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:53:12	2026-01-31 12:53:12
125	VIDRIOTEMSA:70	vidrio_templado	Vidrio Templado IP 14PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:53:22	2026-01-31 12:53:22
126	VIDRIOTEMSA:69	vidrio_templado	Vidrio Templado IP 14PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:53:35	2026-01-31 12:53:35
127	VIDRIOTEMSA:76	vidrio_templado	Vidrio Templado IP 14PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 12:58:33	2026-01-31 12:58:33
129	VIDRIOTEMSA:89	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:03:16	2026-01-31 13:03:16
130	VIDRIOTEMSA:88	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:03:25	2026-01-31 13:03:25
131	VIDRIOTEMSA:87	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:03:38	2026-01-31 13:03:38
132	VIDRIOTEMSA:86	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:03:59	2026-01-31 13:03:59
133	VIDRIOTEMSA:85	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:04:08	2026-01-31 13:04:08
134	VIDRIOTEMSA:84	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:04:18	2026-01-31 13:04:18
137	VIDRIOTEMSA:81	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:04:49	2026-01-31 13:04:49
138	VIDRIOTEMSA:80	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:05:00	2026-01-31 13:05:00
140	VIDRIOTEMSA:78	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:05:21	2026-01-31 13:05:21
141	VIDRIOTEMSA:77	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:05:30	2026-01-31 13:05:30
145	VIDRIOTEMSA:106	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 13:10:16	2026-01-31 13:10:16
148	VIDRIOTEMSA:103	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 13:11:01	2026-01-31 13:11:01
149	VIDRIOTEMSA:102	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 13:11:12	2026-01-31 13:11:12
154	VIDRIOTEMSA:97	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 13:12:13	2026-01-31 13:12:13
1232	FUNDAS_DIS_173	funda	FUNDA DE SILICONA IP 11 PRO MAX	CHINA	20.00	60.00	disponible	2026-02-16 13:20:26	2026-02-16 13:20:26
156	VIDRIOTEMSA:95	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 13:12:40	2026-01-31 13:12:40
157	VIDRIOTEMSA:94	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 13:12:59	2026-01-31 13:12:59
158	VIDRIOTEMSA:93	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 13:13:09	2026-01-31 13:13:09
159	VIDRIOTEMSA:92	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 13:13:21	2026-01-31 13:13:21
150	VIDRIOTEMSA:101	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:11:24	2026-02-10 14:35:48
142	VIDRIOTEMSA:91	vidrio_templado	Vidrio Templado IP 15	GZ STORES	11.00	40.00	vendido	2026-01-31 13:06:21	2026-02-11 10:21:33
169	VIDRIOTEMSA:121	vidrio_templado	Vidrio Templado IP 16	GZ STORES	11.00	40.00	disponible	2026-01-31 13:20:41	2026-01-31 13:20:41
170	VIDRIOTEMSA:120	vidrio_templado	Vidrio Templado IP 16	GZ STORES	11.00	40.00	disponible	2026-01-31 13:21:02	2026-01-31 13:21:02
139	VIDRIOTEMSA:79	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:05:11	2026-02-20 20:17:07
161	VIDRIOTEMSA:115	vidrio_templado	Vidrio Templado IP 15 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:14:56	2026-02-23 10:15:53
146	VIDRIOTEMSA:105	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:10:37	2026-02-24 19:56:13
162	VIDRIOTEMSA:114	vidrio_templado	Vidrio Templado IP 15 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:15:05	2026-02-24 20:00:22
116	VIDRIOTEMSA:63	vidrio_templado	Vidrio Templado IP 13/14	GZ STORES	11.00	40.00	vendido	2026-01-31 12:49:14	2026-02-26 19:26:43
151	VIDRIOTEMSA:100	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:11:39	2026-03-09 10:08:26
135	VIDRIOTEMSA:83	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:04:28	2026-03-09 10:46:27
144	VIDRIOTEMSA:107	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:10:05	2026-03-09 19:26:09
152	VIDRIOTEMSA:99	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:11:51	2026-03-09 19:26:48
164	VIDRIOTEMSA:112	vidrio_templado	Vidrio Templado IP 15 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:15:25	2026-03-09 19:29:28
160	VIDRIOTEMSA:116	vidrio_templado	Vidrio Templado IP 15 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:14:46	2026-03-09 19:59:18
147	VIDRIOTEMSA:104	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:10:50	2026-03-09 20:00:24
153	VIDRIOTEMSA:98	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:12:02	2026-03-20 13:11:11
123	VIDRIOTEMSA:72	vidrio_templado	Vidrio Templado IP 14PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 12:53:03	2026-03-23 09:34:58
128	VIDRIOTEMSA:90	vidrio_templado	Vidrio Templado IP 14PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:02:43	2026-03-24 09:30:34
113	VIDRIOTEMSA:66	vidrio_templado	Vidrio Templado IP 13/14	GZ STORES	11.00	40.00	vendido	2026-01-31 12:48:35	2026-03-27 10:33:48
136	VIDRIOTEMSA:82	vidrio_templado	Vidrio Templado IP 14 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:04:37	2026-03-31 17:12:08
121	VIDRIOTEMSA:74	vidrio_templado	Vidrio Templado IP 14PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 12:52:41	2026-03-31 17:54:24
165	VIDRIOTEMSA:111	vidrio_templado	Vidrio Templado IP 15 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:15:35	2026-03-31 17:54:42
163	VIDRIOTEMSA:113	vidrio_templado	Vidrio Templado IP 15 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:15:14	2026-03-31 18:18:24
171	VIDRIOTEMSA:119	vidrio_templado	Vidrio Templado IP 16	GZ STORES	11.00	40.00	disponible	2026-01-31 13:21:16	2026-01-31 13:21:16
172	VIDRIOTEMSA:118	vidrio_templado	Vidrio Templado IP 16	GZ STORES	11.00	40.00	disponible	2026-01-31 13:21:32	2026-01-31 13:21:32
174	VIDRIOTEMSA:125	vidrio_templado	Vidrio Templado IP 16 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 13:22:20	2026-01-31 13:22:20
175	VIDRIOTEMSA:124	vidrio_templado	Vidrio Templado IP 16 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 13:22:32	2026-01-31 13:22:32
176	VIDRIOTEMSA:123	vidrio_templado	Vidrio Templado IP 16 PRO	GZ STORES	11.00	40.00	disponible	2026-01-31 13:22:41	2026-01-31 13:22:41
178	VIDRIOTEMSA:150	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:24:20	2026-01-31 13:24:20
180	VIDRIOTEMSA:148	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	11.00	40.00	disponible	2026-01-31 13:24:47	2026-01-31 13:24:47
186	VIDRIOTEMSA:175	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:33:14	2026-01-31 13:33:14
187	VIDRIOTEMSA:174	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:33:26	2026-01-31 13:33:26
188	VIDRIOTEMSA:173	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:33:43	2026-01-31 13:33:43
189	VIDRIOTEMSA:172	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:33:55	2026-01-31 13:33:55
190	VIDRIOTEMSA:171	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:34:05	2026-01-31 13:34:05
192	VIDRIOTEMSA:169	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:34:32	2026-01-31 13:34:32
193	VIDRIOTEMSA:168	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:34:49	2026-01-31 13:34:49
195	VIDRIOTEMSA:166	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:35:50	2026-01-31 13:35:50
197	VIDRIOTEMSA:164	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:36:13	2026-01-31 13:36:13
198	VIDRIOTEMSA:163	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:36:24	2026-01-31 13:36:24
200	VIDRIOTEMSA:161	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:36:47	2026-01-31 13:36:47
201	VIDRIOTEMSA:160	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	disponible	2026-01-31 13:36:58	2026-01-31 13:36:58
1233	FUNDAS_DIS_172	funda	FUNDA DE SILICONA IP 11 PRO MAX	CHINA	20.00	60.00	disponible	2026-02-16 13:20:29	2026-02-16 13:20:29
216	Camara:16	vidrio_camara	Vidrio de Camara IP	GZ STORES	20.00	40.00	disponible	2026-01-31 16:21:49	2026-01-31 16:21:49
217	Camara:20	vidrio_camara	Vidrio de Camara IP	GZ STORES	20.00	40.00	disponible	2026-01-31 16:22:21	2026-01-31 16:22:21
218	Camara:15	vidrio_camara	Vidrio de Camara IP	GZ STORES	20.00	40.00	disponible	2026-01-31 16:23:31	2026-01-31 16:23:31
219	Camara:21	vidrio_camara	Vidrio de Camara IP	GZ STORES	20.00	40.00	disponible	2026-01-31 16:23:50	2026-01-31 16:23:50
220	Camara:22	vidrio_templado	Vidrio de Camara IP	GZ STORES	20.00	40.00	disponible	2026-01-31 16:24:05	2026-01-31 16:24:05
221	Camara:18	vidrio_camara	Vidrio de Camara IP	GZ STORES	20.00	40.00	disponible	2026-01-31 16:24:50	2026-01-31 16:24:50
222	Camara:17	vidrio_camara	Vidrio de Camara IP	GZ STORES	20.00	40.00	disponible	2026-01-31 16:25:01	2026-01-31 16:25:01
223	Camara:23	vidrio_camara	Vidrio de Camara IP	gz stores	20.00	40.00	disponible	2026-01-31 16:40:46	2026-01-31 16:40:46
206	VIDRIOTEMSA:176	vidrio_templado	Vidrio Templado IP 17 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:38:34	2026-02-02 19:33:50
210	VIDRIOTEMSA:186	vidrio_templado	Vidrio Templado IP 17 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:39:42	2026-02-03 19:43:46
215	VIDRIOTEMSA:181	vidrio_templado	Vidrio Templado IP 17 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:41:00	2026-02-05 14:10:27
205	VIDRIOTEMSA:177	vidrio_templado	Vidrio Templado IP 17 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:38:24	2026-02-10 14:34:41
211	VIDRIOTEMSA:185	vidrio_templado	Vidrio Templado IP 17 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:39:54	2026-02-10 14:36:08
167	VIDRIOTEMSA:109	vidrio_templado	Vidrio Templado IP 15 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:16:03	2026-02-11 11:02:07
224	Camara:124	vidrio_camara	Vidrio Templado 11 Pro/11 pro max/ 12 pro	GZ STORES	20.00	40.00	disponible	2026-01-31 16:58:36	2026-01-31 16:58:36
225	Camara:154	vidrio_camara	Vidrio Camara IP 11 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 16:59:54	2026-01-31 16:59:54
226	Camara:153	vidrio_camara	Vidrio Camara IP 11 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 17:00:09	2026-01-31 17:00:09
208	VIDRIOTEMSA:188	vidrio_templado	Vidrio Templado IP 17 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:39:19	2026-02-13 23:55:09
227	Camara:152	vidrio_camara	Vidrio Camara IP 11 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 17:00:29	2026-01-31 17:00:29
228	Camara:151	vidrio_camara	Vidrio Camara IP 11 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 17:00:49	2026-01-31 17:00:49
199	VIDRIOTEMSA:162	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	vendido	2026-01-31 13:36:37	2026-02-14 22:04:45
173	VIDRIOTEMSA:117	vidrio_templado	Vidrio Templado IP 16	GZ STORES	11.00	40.00	vendido	2026-01-31 13:21:44	2026-02-14 22:15:54
202	VIDRIOTEMSA:180	vidrio_templado	Vidrio Templado IP 17 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:37:46	2026-02-18 22:49:16
209	VIDRIOTEMSA:187	vidrio_templado	Vidrio Templado IP 17 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:39:32	2026-02-20 13:03:58
182	VIDRIOTEMSA:146	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:25:14	2026-02-20 20:17:07
184	VIDRIOTEMSA:127	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:25:44	2026-02-24 20:00:01
213	VIDRIOTEMSA:183	vidrio_templado	Vidrio Templado IP 17 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:40:16	2026-03-09 09:36:29
185	VIDRIOTEMSA:126	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:25:56	2026-03-09 09:37:27
203	VIDRIOTEMSA:179	vidrio_templado	Vidrio Templado IP 17 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:38:00	2026-03-09 19:28:49
214	VIDRIOTEMSA:182	vidrio_templado	Vidrio Templado IP 17 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:40:48	2026-03-09 19:39:18
196	VIDRIOTEMSA:165	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	vendido	2026-01-31 13:36:00	2026-03-10 09:23:57
183	VIDRIOTEMSA:128	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:25:32	2026-03-10 19:09:16
191	VIDRIOTEMSA:170	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	vendido	2026-01-31 13:34:17	2026-03-17 09:51:58
204	VIDRIOTEMSA:178	vidrio_templado	Vidrio Templado IP 17 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:38:13	2026-03-17 19:12:06
177	VIDRIOTEMSA:151	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:24:06	2026-03-24 19:38:26
229	Camara:150	vidrio_camara	Vidrio Camara IP 11 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 17:01:05	2026-01-31 17:01:05
230	Camara:149	vidrio_camara	Vidrio Camara IP 11 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 17:01:41	2026-01-31 17:01:41
231	Camara:148	vidrio_camara	Vidrio Camara IP 11 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 17:01:58	2026-01-31 17:01:58
232	Camara:142	vidrio_camara	Vidrio Camara IP 11 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 17:03:41	2026-01-31 17:03:41
233	Camara:141	vidrio_camara	Vidrio Camara IP 11 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 17:04:02	2026-01-31 17:04:02
234	Camara:143	vidrio_camara	Vidrio Camara IP 11 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 17:04:23	2026-01-31 17:04:23
235	Camara:144	vidrio_camara	Vidrio Camara IP 11 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 17:04:51	2026-01-31 17:04:51
236	Camara:139	vidrio_camara	Vidrio Camara IP 11	GZ STORES	20.00	40.00	disponible	2026-01-31 17:05:14	2026-01-31 17:05:14
237	Camara:136	vidrio_camara	Vidrio Camara IP 11	GZ STORES	20.00	40.00	disponible	2026-01-31 17:05:33	2026-01-31 17:05:33
238	Camara:126	vidrio_camara	Vidrio Camara IP 12	GZ STORES	20.00	40.00	disponible	2026-01-31 17:06:03	2026-01-31 17:06:03
239	Camara:130	vidrio_camara	Vidrio Camara IP 12 Pro	GZ STORES	20.00	40.00	disponible	2026-01-31 17:10:17	2026-01-31 17:10:17
240	Camara:129	vidrio_camara	Vidrio Camara IP 12 Pro	GZ STORES	20.00	40.00	disponible	2026-01-31 17:10:44	2026-01-31 17:10:44
241	Camara:131	vidrio_camara	Vidrio Camara IP 12 Pro	GZ STORES	20.00	40.00	disponible	2026-01-31 17:13:53	2026-01-31 17:13:53
242	Camara:135	vidrio_camara	Vidrio Camara IP 12 Pro Max	GZ STORES	20.00	40.00	disponible	2026-01-31 17:14:13	2026-01-31 17:14:13
243	Camara:134	vidrio_camara	Vidrio Camara IP 12 Pro Max	GZ STORES	20.00	40.00	disponible	2026-01-31 17:14:28	2026-01-31 17:14:28
244	Camara:133	vidrio_camara	Vidrio Camara IP 12 Pro Max	GZ STORES	20.00	40.00	disponible	2026-01-31 17:14:46	2026-01-31 17:14:46
245	Camara:121	vidrio_camara	Vidrio Camara IP 12 Pro Max	GZ STORES	20.00	40.00	disponible	2026-01-31 17:15:11	2026-01-31 17:15:11
246	Camara:117	vidrio_camara	Vidrio Camara IP 12 Pro Max	GZ STORES	20.00	40.00	disponible	2026-01-31 17:15:34	2026-01-31 17:15:34
247	Camara:116	vidrio_camara	Vidrio Camara IP 12 Pro Max	GZ STORES	20.00	40.00	disponible	2026-01-31 17:15:49	2026-01-31 17:15:49
248	Camara:118	vidrio_camara	Vidrio Camara IP 12 Pro Max	GZ STORES	20.00	40.00	disponible	2026-01-31 17:16:02	2026-01-31 17:16:02
249	Camara:119	vidrio_camara	Vidrio Camara IP 12 Pro Max	GZ STORES	20.00	40.00	disponible	2026-01-31 17:16:22	2026-01-31 17:16:22
250	Camara:120	vidrio_camara	Vidrio Camara IP 12 Pro Max	GZ STORES	20.00	40.00	disponible	2026-01-31 17:16:34	2026-01-31 17:16:34
251	Camara:110	vidrio_camara	Vidrio de Camara IP 13 MINI	GZ STORES	20.00	40.00	disponible	2026-01-31 17:40:52	2026-01-31 17:40:52
252	Camara:112	vidrio_camara	Vidrio de Camara IP 13 MINI	GZ STORES	20.00	40.00	disponible	2026-01-31 17:41:20	2026-01-31 17:41:20
253	Camara:113	vidrio_camara	Vidrio de Camara IP 13 MINI	GZ STORES	20.00	40.00	disponible	2026-01-31 17:41:32	2026-01-31 17:41:32
254	Camara:114	vidrio_camara	Vidrio de Camara IP 13 MINI	GZ STORES	20.00	40.00	disponible	2026-01-31 17:41:44	2026-01-31 17:41:44
255	Camara:115	vidrio_camara	Vidrio de Camara IP 13 MINI	GZ STORES	20.00	40.00	disponible	2026-01-31 17:41:56	2026-01-31 17:41:56
256	Camara:111	vidrio_camara	Vidrio de Camara IP 13 MINI	GZ STORES	20.00	40.00	disponible	2026-01-31 17:42:08	2026-01-31 17:42:08
257	Camara:109	vidrio_camara	Vidrio de Camara IP 13 MINI	GZ STORES	20.00	40.00	disponible	2026-01-31 17:42:25	2026-01-31 17:42:25
258	Camara: 26	vidrio_camara	Vidrio de Camara IP 13 / 13 MINI	GZ STORES	20.00	40.00	disponible	2026-01-31 17:42:54	2026-01-31 17:42:54
259	Camara: 27	vidrio_camara	Vidrio de Camara IP 13 / 13 MINI	GZ STORES	20.00	40.00	disponible	2026-01-31 17:43:12	2026-01-31 17:43:12
260	Camara: 19	vidrio_camara	Vidrio de Camara IP 13 PINK	GZ STORES	20.00	40.00	disponible	2026-01-31 17:43:35	2026-01-31 17:43:35
261	Camara: 13	vidrio_camara	Vidrio de Camara IP 13 BLUE	GZ STORES	20.00	40.00	disponible	2026-01-31 17:43:58	2026-01-31 17:43:58
262	Camara:102	vidrio_camara	Vidrio de Camara IP 13	GZ STORES	20.00	40.00	disponible	2026-01-31 17:44:22	2026-01-31 17:44:22
263	Camara:107	vidrio_camara	Vidrio de Camara IP 13	GZ STORES	20.00	40.00	disponible	2026-01-31 17:44:32	2026-01-31 17:44:32
264	Camara:100	vidrio_camara	Vidrio de Camara IP 13	GZ STORES	20.00	40.00	disponible	2026-01-31 17:44:45	2026-01-31 17:44:45
265	Camara:106	vidrio_camara	Vidrio de Camara IP 13	GZ STORES	20.00	40.00	disponible	2026-01-31 17:44:57	2026-01-31 17:44:57
266	Camara:105	vidrio_camara	Vidrio de Camara IP 13	GZ STORES	20.00	40.00	disponible	2026-01-31 17:45:08	2026-01-31 17:45:08
267	FundaSili:84	funda	FUNDA IP XS	GZ STORES	20.00	60.00	vendido	2026-01-31 18:17:26	2026-01-31 18:19:03
62	VIDRIOTEMSA:11	vidrio_templado	Vidrio Templado IP X/XS/11PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 12:11:16	2026-01-31 18:19:03
274	Camara:31	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:52:26	2026-01-31 18:52:26
268	FUNDAPRIMA	funda	FUNDA IP 13	GZ STORES	20.00	70.00	vendido	2026-01-31 18:42:54	2026-01-31 18:44:03
269	Camara:3	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	45.00	disponible	2026-01-31 18:50:25	2026-01-31 18:50:25
270	Camara:56	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:50:58	2026-01-31 18:50:58
272	Camara:58	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:51:48	2026-01-31 18:51:48
273	Camara:24	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:52:07	2026-01-31 18:52:07
275	Camara:2	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:53:36	2026-01-31 18:53:36
276	Camara:29	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:54:09	2026-01-31 18:54:09
277	Camara:32	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:54:34	2026-01-31 18:54:34
278	Camara:57	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:55:14	2026-01-31 18:55:14
279	Camara:67	vidrio_camara	VIDRIO CAMARA 14 PRO	GZ STORES	20.00	40.00	disponible	2026-01-31 18:56:17	2026-01-31 18:56:17
280	Camara:68	vidrio_camara	VIDRIO CAMARA 14 PRO	GZ STORES	20.00	40.00	disponible	2026-01-31 18:56:34	2026-01-31 18:56:34
281	Camara:69	vidrio_camara	VIDRIO CAMARA 14 PRO	GZ STORES	20.00	40.00	disponible	2026-01-31 18:57:09	2026-01-31 18:57:09
282	Camara:71	vidrio_camara	VIDRIO CAMARA 14 PRO	GZ STORES	20.00	40.00	disponible	2026-01-31 18:57:35	2026-01-31 18:57:35
283	Camara:73	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:57:59	2026-01-31 18:57:59
284	Camara:70	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:58:11	2026-01-31 18:58:11
285	Camara:74	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:58:26	2026-01-31 18:58:26
286	Camara:97	vidrio_camara	VIDRIO CAMARA 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-01-31 18:58:44	2026-01-31 18:58:44
287	S01-K15301M8110344651	otro	PLAY STATION PRO	EEUU CARLOS	7188.00	8000.00	vendido	2026-02-02 19:22:13	2026-02-02 19:23:14
288	FUNDANANI	funda	FUNDA SILICONA IP 15 PRO MAX	GZ STORES	20.00	20.00	vendido	2026-02-02 19:29:00	2026-02-02 19:32:01
289	FUNDAPRIMO	funda	FUNDA MAGSAFE IP 17 PM	GZ STORES	40.00	95.00	vendido	2026-02-02 19:30:33	2026-02-02 19:33:24
212	VIDRIOTEMSA:184	vidrio_templado	Vidrio Templado IP 17 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:40:05	2026-02-02 19:33:24
327	ACCESORIO_28	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:28:38	2026-02-04 14:28:38
290	CASE	funda	CASE 17 PRO MAX	GZ STORES	200.00	250.00	vendido	2026-02-03 19:38:26	2026-02-03 19:43:46
291	Camara:38	vidrio_camara	Vidrio Camara IP 15 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:16:31	2026-02-04 12:16:31
292	Camara:36	vidrio_camara	Vidrio Camara IP 15 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:16:49	2026-02-04 12:16:49
293	Camara:49	vidrio_camara	Vidrio Camara IP 15 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:16:58	2026-02-04 12:16:58
294	Camara:35	vidrio_camara	Vidrio Camara IP 15 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:17:10	2026-02-04 12:17:10
295	Camara:48	vidrio_camara	Vidrio Camara IP 15 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:17:20	2026-02-04 12:17:20
296	Camara:37	vidrio_camara	Vidrio Camara IP 15 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:17:30	2026-02-04 12:17:30
297	Camara:60	vidrio_camara	Vidrio Camara IP 15 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:17:40	2026-02-04 12:17:40
298	Camara:43	vidrio_camara	Vidrio Camara IP 15 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:17:51	2026-02-04 12:17:51
299	Camara:44	vidrio_camara	Vidrio Camara IP 15 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:18:04	2026-02-04 12:18:04
300	Camara:40	vidrio_camara	Vidrio Camara IP 15 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:18:14	2026-02-04 12:18:14
301	Camara:5	vidrio_camara	Vidrio Camara IP 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:19:16	2026-02-04 12:25:59
302	Camara:11	vidrio_camara	Vidrio Camara IP 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:19:26	2026-02-04 12:27:11
303	Camara:82	vidrio_camara	Vidrio Camara de IP 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:30:33	2026-02-04 12:30:33
304	Camara:12	vidrio_camara	Vidrio Camara de IP 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:31:13	2026-02-04 12:31:13
305	Camara:4	vidrio_camara	Vidrio Camara de IP 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:31:25	2026-02-04 12:31:25
306	Camara:8	vidrio_camara	Vidrio Camara de IP 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:31:41	2026-02-04 12:31:41
307	Camara:7	vidrio_camara	Vidrio Camara de IP 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:32:09	2026-02-04 12:32:09
308	Camara:9	vidrio_camara	Vidrio Camara de IP 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:32:31	2026-02-04 12:32:31
309	Camara:6	vidrio_camara	Vidrio Camara de IP 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:32:42	2026-02-04 12:32:42
310	Camara:1	vidrio_camara	Vidrio Camara de IP 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:32:54	2026-02-04 12:32:54
311	Camara:14	vidrio_camara	Vidrio Camara de IP 13 PRO MAX	GZ STORES	20.00	40.00	disponible	2026-02-04 12:34:17	2026-02-04 12:34:17
312	ACCESORIO_3	vidrio_templado	Vidrio Protecto IWach for 40 mm	GZ STORES	20.00	50.00	disponible	2026-02-04 12:38:49	2026-02-04 12:38:49
313	ACCESORIO_4	vidrio_templado	Vidrio Protecto IWach for 40 mm	GZ STORES	20.00	50.00	disponible	2026-02-04 12:39:10	2026-02-04 12:39:10
314	ACCESORIO_6	vidrio_templado	Vidrio Protecto IWach for 41 mm	GZ STORES	20.00	50.00	disponible	2026-02-04 12:39:50	2026-02-04 12:39:50
315	ACCESORIO_7	vidrio_templado	Vidrio Protecto IWach for 42 mm	GZ STORES	20.00	50.00	disponible	2026-02-04 12:40:40	2026-02-04 12:40:40
316	ACCESORIO_9	vidrio_templado	Vidrio Protecto IWach for 45 mm	GZ STORES	20.00	50.00	disponible	2026-02-04 12:41:10	2026-02-04 12:41:10
317	ACCESORIO_10	vidrio_templado	Vidrio Protecto IWach for 45 mm	GZ STORES	20.00	50.00	disponible	2026-02-04 12:41:23	2026-02-04 12:41:23
318	ACCESORIO_8	vidrio_templado	Vidrio Protecto IWach for 42 mm	GZ STORES	20.00	50.00	disponible	2026-02-04 12:41:46	2026-02-04 12:41:46
319	ACCESORIO_5	vidrio_templado	Vidrio Protecto IWach for 41 mm	GZ STORES	20.00	50.00	disponible	2026-02-04 12:41:59	2026-02-04 12:41:59
320	ACCESORIO_1	vidrio_templado	Vidrio Protecto IWach for 38 mm	GZ STORES	20.00	50.00	disponible	2026-02-04 12:42:18	2026-02-04 12:42:18
321	ACCESORIO_2	vidrio_templado	Vidrio Protecto IWach for 38 mm	GZ STORES	20.00	50.00	disponible	2026-02-04 12:42:34	2026-02-04 12:42:34
322	Manilla:1	accesorio	Set Manillas de Remplazo Iwatch for 44 MM	GZ STORES	25.00	60.00	disponible	2026-02-04 12:44:03	2026-02-04 12:44:03
323	Manilla:4	accesorio	Set Manillas de Remplazo Iwatch for 44 MM	GZ STORES	25.00	60.00	disponible	2026-02-04 12:44:19	2026-02-04 12:44:19
324	Manilla:2	accesorio	Set Manillas de Remplazo Iwatch for 44 MM	GZ STORES	25.00	60.00	disponible	2026-02-04 12:44:34	2026-02-04 12:44:34
325	ACCESORIO_26	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:27:51	2026-02-04 14:27:51
326	ACCESORIO_22	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:28:11	2026-02-04 14:28:11
329	ACCESORIO_21	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:29:46	2026-02-04 14:29:46
330	ACCESORIO_30	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:30:30	2026-02-04 14:30:30
331	ACCESORIO_20	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:32:07	2026-02-04 14:32:07
333	ACCESORIO_24	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:37:39	2026-02-04 14:37:39
334	ACCESPROTECTOR: 5	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:43:02	2026-02-04 14:43:02
335	ACCESPROTECTOR: 2	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:43:26	2026-02-04 14:43:26
336	ACCESPROTECTOR: 1	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:43:47	2026-02-04 14:43:47
337	ACCESPROTECTOR: 4	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:47:48	2026-02-04 14:47:48
338	ACCESPROTECTOR: 3	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	disponible	2026-02-04 14:48:47	2026-02-04 14:48:47
339	VDRIOCAM: 1	vidrio_camara	Vidrio Templado de Camara iP 15 PRO MAX	GZ STORES	22.00	40.00	disponible	2026-02-04 14:49:34	2026-02-04 14:49:34
340	FUNDA_AIRPODS_3	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 14:57:35	2026-02-04 14:57:35
341	FUNDA_AIRPODS_6	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:04:53	2026-02-04 15:04:53
342	FUNDA_AIRPODS_5	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:06:07	2026-02-04 15:06:07
343	FUNDA_AIRPODS_2	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:06:38	2026-02-04 15:06:38
328	ACCESORIO_27	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	75.00	vendido	2026-02-04 14:29:17	2026-02-23 19:39:58
345	AIRPODSFUN: 1	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:07:41	2026-02-04 15:07:41
346	FUNDA_AYE_10	accesorio	Funda Airpods 1era Gen	Ayelen Vargas	8.00	40.00	disponible	2026-02-04 15:23:11	2026-02-04 15:23:25
347	FUNDA_AIRPODS_11	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:24:13	2026-02-04 15:24:13
348	FUNDA_AIRPODS_9	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:24:29	2026-02-04 15:24:29
349	FUNDA_AIRPODS_10	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:25:07	2026-02-04 15:25:07
350	AIRPODSFUN: 2	accesorio	Fundas Airpods	GZ STORES	40.00	50.00	disponible	2026-02-04 15:25:50	2026-02-04 15:25:50
351	FUNDA_AIRPODS_12	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:26:22	2026-02-04 15:26:22
352	AIRPODSFUN: 4	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:26:47	2026-02-04 15:26:47
353	FUNDA_AIRPODS_7	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:30:19	2026-02-04 15:30:19
354	AIRPODSFUN: 3	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:30:37	2026-02-04 15:30:37
355	FUNDA_AIRPODS_8	accesorio	Fundas Airpods	GZ STORES	25.00	50.00	disponible	2026-02-04 15:30:51	2026-02-04 15:30:51
358	ACCESORY: 26	accesorio	Fire TV Stick 4k	Carlos EEUU	368.00	480.00	disponible	2026-02-04 17:28:19	2026-02-04 17:28:19
359	ACCESORY: 27	accesorio	Fire TV Stick 4k	CARLOS EEUU	368.00	480.00	disponible	2026-02-04 17:28:58	2026-02-04 17:28:58
360	ACCESORY: 20	accesorio	Backbone PS5	Carlos EEUU	650.00	750.00	disponible	2026-02-04 17:34:02	2026-02-04 17:34:02
361	ACCESORY: 18	accesorio	Teclado Gamer	GZ STORES	100.00	190.00	disponible	2026-02-04 17:34:33	2026-02-04 17:34:33
362	ACCESORY: 19	accesorio	Teclado Gamer	GZ STORES	100.00	190.00	disponible	2026-02-04 17:35:05	2026-02-04 17:35:05
363	ACCESORY: 17	accesorio	15W Max Fast Charging Magnetic	GZ STORES	120.00	250.00	disponible	2026-02-04 17:36:38	2026-02-04 17:36:38
364	ACCESORY: 16	accesorio	Folding Keyboard Portable - Fashion	GZ STORES	290.00	390.00	disponible	2026-02-04 17:38:39	2026-02-04 17:38:39
365	ACCESORY: 15	accesorio	Bluetooth Keyboard	GZ STORES	290.00	390.00	disponible	2026-02-04 17:39:22	2026-02-04 17:39:22
366	ACCESORY: 11	accesorio	Galaxy Buds2 Pro	GZ STORES	120.00	280.00	disponible	2026-02-04 17:40:43	2026-02-04 17:40:43
367	ACCESORY: 10	accesorio	Galaxy Buds2 Pro	GZ STORES	120.00	280.00	disponible	2026-02-04 17:41:04	2026-02-04 17:41:04
368	ACCESORY: 9	accesorio	Galaxy Buds2 Pro	GZ STORES	120.00	280.00	disponible	2026-02-04 17:41:19	2026-02-04 17:41:19
369	ACCESORY: 8	accesorio	Apple Watch Ultra 2 49 mm Copia	Santi Store	400.00	550.00	disponible	2026-02-04 17:42:46	2026-02-04 17:42:46
370	ACCESORY: 14	accesorio	ULTRA 2 IVV9	GZ STORES	269.00	370.00	disponible	2026-02-04 17:46:38	2026-02-04 17:46:38
371	ACCESORY: 13	accesorio	ULTRA 2 IVV9	GZ STORES	269.00	370.00	disponible	2026-02-04 17:47:02	2026-02-04 17:47:02
372	ACCESORY: 12	accesorio	VV9 PRO + Watch	GZ STORES	269.00	370.00	disponible	2026-02-04 17:47:37	2026-02-04 17:47:37
373	CARGADOR_PORTA:2	accesorio	Power Bank Magsafe	GZ STORES	200.00	590.00	disponible	2026-02-04 17:51:02	2026-02-04 17:51:02
374	MICROFONO_U:1	accesorio	Microfono Wireless Microphone	GZ STORES	100.00	270.00	disponible	2026-02-04 17:53:25	2026-02-04 17:53:25
375	MICROFONO_U:2	accesorio	Microfono Wireless Microphone	GZ STORES	100.00	270.00	disponible	2026-02-04 17:53:43	2026-02-04 17:53:43
379	ACCESORY: 7	accesorio	Earpods Lighning Connector	GZ STORES	110.00	170.00	disponible	2026-02-04 17:58:22	2026-02-04 17:58:22
380	ACCESORY:2	accesorio	Lighning to Headphone Jack	GZ STORES	17.00	90.00	disponible	2026-02-04 17:59:16	2026-02-04 17:59:16
381	ACCESORY:1	accesorio	Lighning to Headphone Jack	GZ STORES	17.00	90.00	disponible	2026-02-04 17:59:48	2026-02-04 17:59:48
382	ACCESORY: 6	accesorio	Lighning to Headphone Jack	GZ STORES	17.00	90.00	disponible	2026-02-04 18:00:22	2026-02-04 18:00:22
383	ACCESORY: 23	accesorio	Mando Dualshock 4 Naranja	GZ STORES	200.00	350.00	disponible	2026-02-04 18:02:49	2026-02-04 18:02:49
384	ACCESORY: 24	accesorio	Mando Dualshock 4 DRAGON BALL	GZ STORES	200.00	350.00	disponible	2026-02-04 18:03:43	2026-02-04 18:03:43
385	ACCESORY: 22	accesorio	Mando Dualshock 4 Fortnite	GZ STORES	200.00	350.00	disponible	2026-02-04 18:04:05	2026-02-04 18:04:05
386	ACCESORY: 21	accesorio	Mando Dualshock 4 FIFA	GZ STORES	200.00	350.00	disponible	2026-02-04 18:04:31	2026-02-04 18:04:31
387	ACCESORY: 25	accesorio	Gerlax Power Bank 20000 mah	GZ STORES	150.00	280.00	disponible	2026-02-04 18:06:38	2026-02-04 18:06:38
388	FUNDAIP	funda	Funda Sil ip 13 pro	GZ STORES	20.00	60.00	vendido	2026-02-04 18:09:52	2026-02-04 18:13:24
389	CABLEIP13	accesorio	CABLE 20W	GZ STORES	45.00	140.00	vendido	2026-02-04 18:11:40	2026-02-04 18:13:24
394	CUBO20W: 8	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:20:03	2026-02-10 14:38:39
1239	FUNDASILI:85	funda	FUNDA DE SILICONA IP X/XS	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:22:40	2026-02-16 13:22:40
398	CUBO20W: 4	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:21:08	2026-02-14 22:04:45
399	CUBO20W: 3	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:21:20	2026-02-14 22:08:30
392	CUBO20W: 10	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:19:36	2026-02-14 22:15:54
393	CUBO20W: 9	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:19:50	2026-02-14 22:18:46
402	CABLELIGHT: 1	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	vendido	2026-02-04 18:27:51	2026-02-14 22:18:46
377	ACCESORY: 4	accesorio	Earpods USB-C	GZ STORES	140.00	200.00	vendido	2026-02-04 17:56:50	2026-02-15 21:31:24
407	CABLELIGHT: 6	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	vendido	2026-02-04 18:30:00	2026-02-23 10:13:38
400	CUBO20W: 2	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:21:33	2026-03-09 19:26:09
344	FUNDA_AIRPODS_1	accesorio	Fundas Airpods	GZ STORES	25.00	60.00	vendido	2026-02-04 15:07:06	2026-02-24 19:56:13
1234	FUNDAS_DIS_171	funda	FUNDA DE SILICONA IP 11 PRO MAX	CHINA	20.00	60.00	vendido	2026-02-16 13:20:31	2026-03-09 19:47:31
403	CABLELIGHT: 2	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	vendido	2026-02-04 18:28:38	2026-03-09 19:26:09
410	CABLELIGHT: 9	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	vendido	2026-02-04 18:31:28	2026-03-19 09:40:26
404	CABLELIGHT: 3	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	160.00	vendido	2026-02-04 18:29:00	2026-03-17 19:09:31
376	ACCESORY: 3	accesorio	Earpods USB-C	GZ STORES	140.00	200.00	vendido	2026-02-04 17:56:13	2026-03-19 09:49:00
378	ACCESORY: 5	accesorio	Earpods USB-C	GZ STORES	140.00	200.00	vendido	2026-02-04 17:57:38	2026-03-20 13:11:11
356	ACCESORY: 29	accesorio	Fire TV Stick 4k 8 Ram Wifi 6	CARLOS EEUU	368.00	480.00	vendido	2026-02-04 17:27:12	2026-03-23 09:35:51
357	ACCESORY: 28	accesorio	Fire TV Stick 4k 8 Ram Wifi 6	Carlos EEUU	368.00	480.00	vendido	2026-02-04 17:27:46	2026-03-27 10:34:57
411	CABLELIGHT: 10	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	disponible	2026-02-04 18:31:51	2026-02-04 18:31:51
1235	FUNDA_SILIC_168	funda	FUNDA DE SILICONA IP 12/12 PRO	CHINA	20.00	60.00	disponible	2026-02-16 13:20:44	2026-02-16 13:20:44
427	CABLEUSB: 8	cargador_5w	Cable Lightning to USB	GZ STORES	35.00	100.00	disponible	2026-02-04 19:02:25	2026-02-04 19:02:25
431	CABLEUSB: 4	cargador_5w	Cable Lightning to USB	GZ STORES	35.00	100.00	disponible	2026-02-04 19:03:42	2026-02-04 19:03:42
436	CUBO5W: 2	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	41.00	150.00	disponible	2026-02-04 19:08:02	2026-02-04 19:08:02
437	GCC296062503035L	accesorio	Alexa Echo Auto	CARLOS EEUU	563.00	620.00	disponible	2026-02-04 19:12:34	2026-02-04 19:16:09
438	GRA22J015406000A	accesorio	Alexa Echo Dot	CARLOS EEUU	400.00	540.00	disponible	2026-02-04 19:18:34	2026-02-04 19:18:34
440	PACKACCE: 1	accesorio	Gamefitz 10 IN 1 Accesories Pack	CARLOS EEUU	100.00	150.00	disponible	2026-02-04 19:27:42	2026-02-04 19:27:42
441	GERLAXCUBO: 1	accesorio	Gerlax 45 W Cubo	GZ STORES	50.00	100.00	disponible	2026-02-04 19:28:58	2026-02-04 19:28:58
166	VIDRIOTEMSA:110	vidrio_templado	Vidrio Templado IP 15 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:15:48	2026-02-04 19:36:50
445	FUNDA17PRO	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	vendido	2026-02-10 14:33:29	2026-02-10 14:34:41
443	funda17promax	funda	GEAR 4 IP 17 PRO MAX	GZ STORES	90.00	110.00	vendido	2026-02-05 13:50:22	2026-02-05 14:10:27
420	CUBOORIGI: 1	cargador_20w	CUBO 20 W ORIGINAL	EDSON	200.00	400.00	vendido	2026-02-04 18:48:09	2026-02-05 14:10:27
421	CABLECAC: 6	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	54.00	190.00	vendido	2026-02-04 18:52:08	2026-02-05 15:37:00
401	CUBO20W: 1	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:21:49	2026-02-07 12:44:13
444	CARGADOR_PORTA:3	accesorio	Power Bank Magsafe	GZ STORES	200.00	590.00	vendido	2026-02-10 14:25:14	2026-02-10 14:26:54
396	CUBO20W: 6	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:20:41	2026-02-10 14:34:41
408	CABLELIGHT: 7	accesorio	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	vendido	2026-02-04 18:30:23	2026-02-10 14:38:39
390	CUBO20W: 12	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:19:01	2026-02-10 14:38:39
409	CABLELIGHT: 8	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	vendido	2026-02-04 18:31:07	2026-02-10 14:38:39
446	FUNDASIL15	funda	FUNDA SILICONA IP 15	GZ STORES	20.00	70.00	vendido	2026-02-11 10:20:08	2026-02-11 10:21:33
447	HAW50062508433	otro	NINTENDO SWITCH 2	CARLOS EEUU	5487.13	6100.00	vendido	2026-02-11 10:23:53	2026-02-11 10:24:34
448	FUNDACARLOS	funda	FUNDA IP 15 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-11 11:01:33	2026-02-11 11:02:07
450	FUNDA_MAG_S:37	funda	FUNDA MAGSAFE IP 16 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 16:58:39	2026-02-11 16:58:39
451	FUNDA_MAG_S:36	funda	FUNDA MAGSAFE IP 16 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 16:59:45	2026-02-11 16:59:45
452	FUNDA_MAG_S:39	funda	FUNDA MAGSAFE IP 16 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:03:10	2026-02-11 17:03:10
453	FUNDA_MAG_S:38	funda	FUNDA MAGSAFE IP 16 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:04:02	2026-02-11 17:04:02
454	FUNDA_MAG_S:40	funda	FUNDA MAGSAFE IP 16 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:06:06	2026-02-11 17:06:06
455	FUNDA_MAG_S:41	funda	FUNDA MAGSAFE IP 16 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:06:31	2026-02-11 17:06:31
456	FUNDA_MAG_S:51	funda	FUNDA MAGSAFE IP 16	GZ STORES	40.00	100.00	disponible	2026-02-11 17:07:11	2026-02-11 17:07:11
458	FUNDA_MAG_S:43	funda	FUNDA MAGSAFE IP 16	GZ STORES	40.00	100.00	disponible	2026-02-11 17:07:56	2026-02-11 17:07:56
459	FUNDA_MAG_S:46	funda	FUNDA MAGSAFE IP 16	GZ STORES	40.00	100.00	disponible	2026-02-11 17:08:20	2026-02-11 17:08:20
460	FUNDA_MAG_S:45	funda	FUNDA MAGSAFE IP 16	GZ STORES	40.00	100.00	disponible	2026-02-11 17:08:46	2026-02-11 17:08:46
461	FUNDA_MAG_S:44	funda	FUNDA MAGSAFE IP 16	GZ STORES	40.00	100.00	disponible	2026-02-11 17:09:13	2026-02-11 17:09:13
463	FUNDA_MAG_S:49	funda	FUNDA MAGSAFE IP 16	GZ STORES	40.00	100.00	disponible	2026-02-11 17:10:32	2026-02-11 17:10:32
419	CUBOORIGI: 3	cargador_20w	CUBO 20 W ORIGINAL	EDSON	200.00	400.00	vendido	2026-02-04 18:47:55	2026-02-13 23:55:09
464	FUNDA_MAG_S:26	funda	FUNDA MAGSAFE IP 16	GZ STORES	40.00	100.00	vendido	2026-02-11 17:10:55	2026-02-14 00:13:38
465	FUNDA_MAG_S:47	funda	FUNDA MAGSAFE IP 16	GZ STORES	40.00	100.00	disponible	2026-02-11 17:11:28	2026-02-11 17:11:28
466	FUNDA: 69	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:12:21	2026-02-11 17:12:21
467	FUNDA: 72	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:12:55	2026-02-11 17:12:55
468	FUNDA: 71	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:13:25	2026-02-11 17:13:25
418	CUBOORIGI: 4	cargador_20w	CUBO 20 W ORIGINAL	EDSON	200.00	400.00	vendido	2026-02-04 18:47:43	2026-02-15 21:31:24
415	CUBOORIGI: 2	cargador_20w	CUBO 20 W ORIGINAL	EDSON	200.00	400.00	vendido	2026-02-04 18:46:53	2026-02-23 10:07:03
462	FUNDA_MAG_S:48	funda	FUNDA MAGSAFE IP 16	GZ STORES	40.00	100.00	vendido	2026-02-11 17:10:08	2026-02-23 10:17:04
435	CUBO5W: 1	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	41.00	150.00	vendido	2026-02-04 19:07:11	2026-02-23 19:35:51
425	CABLECAC: 2	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	54.00	190.00	vendido	2026-02-04 18:53:20	2026-02-23 19:36:45
417	CUBOORIGI: 5	cargador_20w	CUBO 20 W ORIGINAL	EDSON	200.00	400.00	vendido	2026-02-04 18:47:27	2026-02-23 19:39:58
416	CUBOORIGI: 6	cargador_20w	CUBO 20 W ORIGINAL	EDSON	200.00	400.00	vendido	2026-02-04 18:47:13	2026-02-23 19:39:58
457	FUNDA_MAG_S:50	funda	FUNDA MAGSAFE IP 16	GZ STORES	40.00	100.00	vendido	2026-02-11 17:07:33	2026-02-24 19:57:22
424	CABLECAC: 3	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	54.00	190.00	vendido	2026-02-04 18:53:03	2026-03-09 19:26:09
414	CABLELIGHT: 13	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	vendido	2026-02-04 18:33:42	2026-03-09 19:29:28
434	CABLEUSB: 1	cargador_5w	Cable Lightning to USB	GZ STORES	35.00	100.00	vendido	2026-02-04 19:05:38	2026-03-09 19:39:58
442	GRAVACUBO: 1	accesorio	Gravastar 65 W Alpha	GZ STORES	551.00	600.00	vendido	2026-02-04 19:30:36	2026-03-09 19:59:18
423	CABLECAC: 4	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	54.00	190.00	vendido	2026-02-04 18:52:48	2026-03-10 19:08:52
412	CABLELIGHT: 11	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	vendido	2026-02-04 18:33:03	2026-03-17 19:13:17
429	CABLEUSB: 6	cargador_5w	Cable Lightning to USB	GZ STORES	35.00	100.00	vendido	2026-02-04 19:03:08	2026-03-19 09:40:57
428	CABLEUSB: 7	cargador_5w	Cable Lightning to USB	GZ STORES	35.00	100.00	vendido	2026-02-04 19:02:44	2026-03-23 09:34:58
433	CABLEUSB: 2	cargador_5w	Cable Lightning to USB	GZ STORES	35.00	100.00	vendido	2026-02-04 19:05:21	2026-03-23 09:35:51
430	CABLEUSB: 5	cargador_5w	Cable Lightning to USB	GZ STORES	35.00	100.00	vendido	2026-02-04 19:03:28	2026-03-23 09:43:09
469	FUNDA: 66	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:14:27	2026-02-11 17:14:27
470	FUNDA: 59	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:14:49	2026-02-11 17:14:49
471	FUNDA: 68	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:15:14	2026-02-11 17:15:14
472	FUNDA_MAG_S:29	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:15:57	2026-02-11 17:15:57
473	FUNDA_MAG_S:27	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:16:36	2026-02-11 17:16:36
474	FUNDA_MAG_S:28	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:17:12	2026-02-11 17:17:12
475	FUNDA_MAG_S:25	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:17:39	2026-02-11 17:17:39
476	FUNDA_MAG_S:31	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:18:09	2026-02-11 17:18:09
477	FUNDA: 74	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:19:05	2026-02-11 17:19:05
478	FUNDA: 73	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:19:29	2026-02-11 17:19:29
479	FUNDA: 48	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:20:00	2026-02-11 17:20:00
480	FUNDA: 47	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:20:27	2026-02-11 17:20:27
481	FUNDA: 50	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:20:55	2026-02-11 17:20:55
482	FUNDA: 49	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:21:23	2026-02-11 17:21:23
483	FUNDA_MAG_N:22	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:21:46	2026-02-11 17:21:46
484	FUNDA_MAG_N:21	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:22:08	2026-02-11 17:22:08
485	FUNDA_MAG_N:20	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:22:35	2026-02-11 17:22:35
486	FUNDA_MAG_S:35	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:22:59	2026-02-11 17:22:59
487	FUNDA_MAG_S:34	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:23:30	2026-02-11 17:23:30
488	FUNDA_MAG_S:33	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:24:05	2026-02-11 17:24:05
489	FUNDA: 45	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 17:25:42	2026-02-11 17:25:42
490	FUNDA: 67	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 17:26:08	2026-02-11 17:26:08
491	FUNDA: 40	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 17:26:34	2026-02-11 17:26:34
492	FUNDA: 41	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 17:27:03	2026-02-11 17:27:03
493	FUNDA: 42	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 17:27:32	2026-02-11 17:27:32
495	FundaMag:13	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 17:37:30	2026-02-11 17:37:30
496	FundaMag:7	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 17:37:56	2026-02-11 17:37:56
497	FundaMags:32	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 17:38:32	2026-02-11 17:38:32
498	FundaMags:31	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 17:39:19	2026-02-11 17:39:19
499	FundaMags:35	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	150.00	disponible	2026-02-11 17:39:46	2026-02-11 17:39:59
500	FundaMags:37	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	150.00	disponible	2026-02-11 17:40:28	2026-02-11 17:40:28
502	FUNDA: 64	funda	FUNDA MAGSAFE IP 15	GZ STORES	40.00	100.00	disponible	2026-02-11 17:47:50	2026-02-11 17:47:50
503	FUNDA: 46	funda	FUNDA MAGSAFE IP 15	GZ STORES	40.00	100.00	disponible	2026-02-11 17:48:16	2026-02-11 17:48:16
504	FUNDA: 70	funda	FUNDA MAGSAFE IP 15	GZ STORES	40.00	100.00	disponible	2026-02-11 17:48:36	2026-02-11 17:48:36
505	FUNDA_MAG_S:11	funda	FUNDA MAGSAFE IP 15	GZ STORES	40.00	100.00	disponible	2026-02-11 17:49:01	2026-02-11 17:49:01
507	FUNDA: 57	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:55:53	2026-02-11 17:55:53
508	FUNDA: 63	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:56:20	2026-02-11 17:56:20
509	FUNDA: 56	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:56:45	2026-02-11 17:56:45
510	FUNDA: 60	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:57:08	2026-02-11 17:57:08
511	FUNDA: 61	funda	FUNDA MAGSAFE IP 15 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:57:30	2026-02-11 17:57:30
512	Funda Mags: 45	funda	FUNDA MAGSAFE IP 15 PLUS	GZ STORES	40.00	100.00	disponible	2026-02-11 17:58:00	2026-02-11 17:58:00
513	FundaCaj:1	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:58:50	2026-02-11 17:58:50
514	FundaCaj:5	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:59:13	2026-02-11 17:59:13
515	FundaCaj:4	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 17:59:51	2026-02-11 17:59:51
516	FundaMags:26	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:00:16	2026-02-11 18:00:16
517	FundaMags:24	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:01:42	2026-02-11 18:01:42
518	FundaMags:25	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:04:24	2026-02-11 18:04:24
519	FUNDA: 34	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:06:35	2026-02-11 18:06:35
520	FUNDA: 19	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:06:58	2026-02-11 18:06:58
521	FUNDA_MAG:11	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:07:30	2026-02-11 18:07:30
522	FUNDA: 24	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:07:55	2026-02-11 18:07:55
523	FUNDA: 18	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:13:08	2026-02-11 18:13:08
524	FUNDA: 25	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:20:12	2026-02-11 18:20:12
525	FUNDA: 32	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:21:01	2026-02-11 18:21:01
526	FUNDA: 30	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:21:24	2026-02-11 18:21:24
527	FUNDA: 15	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:21:48	2026-02-11 18:21:48
528	FUNDA: 36	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:22:16	2026-02-11 18:22:16
529	FUNDA: 37	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:22:37	2026-02-11 18:22:37
530	FUNDA: 21	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:22:59	2026-02-11 18:22:59
531	FUNDA: 35	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:24:13	2026-02-11 18:24:13
501	FUNDAM_SAFE: 2	funda	FUNDA MAGSAFE IP 15 PRO	GZ STORES	40.00	100.00	vendido	2026-02-11 17:47:21	2026-03-09 19:26:48
532	FUNDA: 39	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:25:31	2026-02-11 18:25:31
533	FUNDA: 29	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:25:51	2026-02-11 18:25:51
534	FUNDA: 38	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:26:25	2026-02-11 18:26:25
535	FUNDA: 23	funda	FUNDA MAGSAFE IP 14 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 18:26:47	2026-02-11 18:26:47
537	FundaMag:6	funda	FUNDA MAGSAFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 18:28:14	2026-02-11 18:28:14
536	FundaCaj:11	funda	FUNDA MAGSFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 18:27:52	2026-02-11 18:28:22
538	FundaMag:5	funda	FUNDA MAGSAFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 18:28:55	2026-02-11 18:28:55
539	FundaMags:33	funda	FUNDA MAGSAFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 18:31:07	2026-02-11 18:31:07
540	FUNDA_MAG:10	funda	FUNDA MAGSAFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 18:35:01	2026-02-11 18:35:01
541	FundaMags:28	funda	FUNDA MAGSAFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 18:35:22	2026-02-11 18:35:22
542	FundaMags:30	funda	FUNDA MAGSAFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 18:35:49	2026-02-11 18:35:49
543	FundaMags:19	funda	FUNDA MAGSAFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 18:36:09	2026-02-11 18:36:09
544	FUNDA_MAG_S:20	funda	FUNDA MAGSAFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 18:36:31	2026-02-11 18:36:31
545	FUNDA_MAG_S:21	funda	FUNDA MAGSAFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 18:37:04	2026-02-11 18:37:04
546	840262382489	funda	FUNDA MAGSAFE IP 14 PRO AYE	AYE	10.00	100.00	disponible	2026-02-11 18:39:02	2026-02-11 18:39:02
547	FUNDA: 13	funda	FUNDA MAGSAFE IP 14	GZ STORES	40.00	100.00	disponible	2026-02-11 18:40:00	2026-02-11 18:40:00
548	FUNDA: 62	funda	FUNDA MAGSAFE IP 14	GZ STORES	40.00	100.00	disponible	2026-02-11 18:40:18	2026-02-11 18:40:18
549	FUNDA: 14	funda	FUNDA MAGSAFE IP 14	GZ STORES	40.00	100.00	disponible	2026-02-11 18:40:43	2026-02-11 18:40:43
550	FUNDA_MAG_S:17	funda	FUNDA MAGSAFE IP 14	GZ STORES	40.00	100.00	disponible	2026-02-11 18:57:15	2026-02-11 18:57:15
551	FUNDA_MAG_S:18	funda	FUNDA MAGSAFE IP 14	GZ STORES	40.00	100.00	disponible	2026-02-11 18:57:55	2026-02-11 18:57:55
552	FUNDA_MAG_S:10	funda	FUNDA MAGSAFE IP 14 PLUS	GZ STORES	40.00	100.00	disponible	2026-02-11 18:58:35	2026-02-11 18:58:45
553	FUNDA_MAG_S:6	funda	FUNDA MAGSAFE IP 13 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:01:39	2026-02-11 19:01:39
554	FUNDA_MAG_S:5	funda	FUNDA MAGSAFE IP 13 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:02:34	2026-02-11 19:02:34
555	FUNDA_MAG_S:7	funda	FUNDA MAGSAFE IP 13 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:03:08	2026-02-11 19:03:08
556	FUNDA_MAG_S:16	funda	FUNDA MAGSAFE IP 13 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 19:03:38	2026-02-11 19:03:38
557	FundaMags:13	funda	FUNDA MAGSAFE IP 12 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:04:22	2026-02-11 19:04:22
558	FUNDA_MAG_S:8	funda	FUNDA MAGSAFE IP 12 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:04:45	2026-02-11 19:04:45
559	FUNDA_MAG_S:9	funda	FUNDA MAGSAFE IP 12 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:05:14	2026-02-11 19:05:14
560	FundaMags:1	funda	FUNDA MAGSAFE IP 11 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:06:26	2026-02-11 19:06:26
561	FundaMags:2	funda	FUNDA MAGSAFE IP 11 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:06:50	2026-02-11 19:06:50
562	FundaMags:3	funda	FUNDA MAGSAFE IP 11 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:07:16	2026-02-11 19:07:16
563	FundaMags:8	funda	FUNDA MAGSAFE IP 11 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:07:45	2026-02-11 19:07:45
564	FundaCaj:12	funda	FUNDA MAGSAFE IP 11 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 19:08:11	2026-02-11 19:08:11
565	FUNDA_MAG_S:4	funda	FUNDA MAGSAFE IP 11 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:08:34	2026-02-11 19:08:34
566	FUNDA_MAG_S:3	funda	FUNDA MAGSAFE IP 11 PRO MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:08:54	2026-02-11 19:08:54
567	FUNDA_MAG_S:2	funda	FUNDA MAGSAFE IP 11	GZ STORES	40.00	100.00	disponible	2026-02-11 19:09:48	2026-02-11 19:09:48
568	FUNDA_MAG_S:1	funda	FUNDA MAGSAFE IP 11	GZ STORES	40.00	100.00	disponible	2026-02-11 19:10:08	2026-02-11 19:10:08
569	FUNDAM_SAFE: 4	funda	FUNDA MAGSAFE IP 11	GZ STORES	40.00	100.00	disponible	2026-02-11 19:11:41	2026-02-11 19:11:41
570	FUNDAM_SAFE: 3	funda	FUNDA MAGSAFE IP 11	GZ STORES	40.00	100.00	disponible	2026-02-11 19:12:00	2026-02-11 19:12:00
571	FUNDA_MAG_S:15	funda	FUNDA MAGSAFE IP XS MAX	GZ STORES	40.00	100.00	disponible	2026-02-11 19:12:35	2026-02-11 19:12:35
572	FUNDA_MAG_S:13	funda	FUNDA MAGSAFE IP XR	GZ STORES	40.00	100.00	disponible	2026-02-11 19:12:56	2026-02-11 19:12:56
573	FUNDA_MAG_S:12	funda	FUNDA MAGSAFE IP XR	GZ STORES	40.00	100.00	disponible	2026-02-11 19:13:16	2026-02-11 19:13:16
574	FUNDA_MAG_S:14	funda	FUNDA MAGSAFE IP XS	GZ STORES	40.00	100.00	disponible	2026-02-11 19:13:40	2026-02-11 19:13:40
575	FUNDAM_SAFE: 5	funda	FUNDA MAGSAFE IP 12	GZ STORES	40.00	100.00	disponible	2026-02-11 19:18:55	2026-02-11 19:18:55
576	FUNDAM_SAFE: 6	funda	FUNDA MAGSAFE IP 12	GZ STORES	40.00	100.00	disponible	2026-02-11 19:19:25	2026-02-11 19:19:25
577	FUNDAM_SAFE: 7	funda	FUNDA MAGSAFE IP 12	GZ STORES	40.00	100.00	disponible	2026-02-11 19:19:47	2026-02-11 19:19:47
578	FUNDAM_SAFE: 8	funda	FUNDA MAGSAFE IP 12	GZ STORES	40.00	100.00	disponible	2026-02-11 19:20:14	2026-02-11 19:20:14
579	FUNDAM_SAFE: 9	funda	FUNDA MAGSAFE IP 13 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 19:20:50	2026-02-11 19:20:50
580	FUNDAM_SAFE: 10	funda	FUNDA MAGSAFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 19:21:37	2026-02-11 19:21:37
581	FUNDAM_SAFE: 11	funda	FUNDA MAGSAFE IP 14 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 19:22:39	2026-02-11 19:22:39
582	FUNDAM_SAFE: 12	funda	FUNDA MAGSAFE IP 16 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 19:23:57	2026-02-11 19:23:57
583	FUNDAM_SAFE: 13	funda	FUNDA MAGSAFE IP 16 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 19:24:25	2026-02-11 19:24:25
584	FUNDAM_SAFE: 14	funda	FUNDA MAGSAFE IP 16 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 19:24:49	2026-02-11 19:24:49
585	FUNDAM_SAFE: 15	funda	FUNDA MAGSAFE IP 16 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 19:25:17	2026-02-11 19:25:17
586	FUNDAM_SAFE: 16	funda	FUNDA MAGSAFE IP 16 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 19:28:51	2026-02-11 19:28:51
587	FUNDAM_SAFE: 17	funda	FUNDA MAGSAFE IP 16 PRO	GZ STORES	40.00	100.00	disponible	2026-02-11 19:30:31	2026-02-11 19:30:31
590	FUNDA_MAG_S:23	funda	FUNDA MAGSAFE IP 12	GZ STORES	40.00	100.00	disponible	2026-02-12 10:51:36	2026-02-12 10:51:36
591	FUNDA_MAG_S:24	funda	FUNDA MAGSAFE IP 12	GZ STORES	40.00	100.00	disponible	2026-02-12 10:52:10	2026-02-12 10:52:10
592	FUNDA_MAG_S:22	funda	FUNDA MAGSAFE IP 12	GZ STORES	40.00	100.00	disponible	2026-02-12 10:52:52	2026-02-12 10:52:52
593	FUNDA: 10	funda	FUNDA MAGSAFE IP 13	GZ STORES	40.00	100.00	disponible	2026-02-12 10:53:16	2026-02-12 10:53:16
397	CUBO20W: 5	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:20:55	2026-02-13 23:34:32
594	CONSOLA: 1	otro	CONSOLA ANBERNIC RG40XXV	ISRAEL LOPEZ - CEL: 68325868	500.00	600.00	disponible	2026-02-13 18:33:53	2026-02-13 23:47:38
595	FundaSili:276	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	100.00	vendido	2026-02-13 23:47:17	2026-02-13 23:50:25
422	CABLECAC: 5	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	54.00	190.00	vendido	2026-02-04 18:52:28	2026-02-13 23:50:25
179	VIDRIOTEMSA:149	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:24:32	2026-02-13 23:53:20
596	FUNDA_SIL_283	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORE	20.00	70.00	vendido	2026-02-13 23:52:41	2026-02-13 23:53:20
589	FUNDAM_SAFE: 18	funda	FUNDA MAGSAFE IP 17 PRO MAX	GZ STORES	40.00	100.00	vendido	2026-02-11 19:32:00	2026-02-13 23:55:09
168	VIDRIOTEMSA:122	vidrio_templado	Vidrio Templado IP 16	GZ STORES	11.00	40.00	vendido	2026-01-31 13:20:29	2026-02-14 00:13:38
597	MANDOBOX	otro	MANDO XBOX GHOST CIPHER	CARLOS EEUU	756.00	900.00	vendido	2026-02-14 00:23:40	2026-02-14 00:24:01
598	FIRETV	accesorio	FIRESTICK 4K MAX	CARLOS EEUU	500.00	750.00	vendido	2026-02-14 00:24:54	2026-02-14 00:25:12
599	AU1	accesorio	NYKO CORE HEADSET	CARLOS EEUU	120.00	190.00	vendido	2026-02-14 00:25:56	2026-02-14 00:26:50
600	AU2	accesorio	NYKO CORE HEADSET	CARLOS EEUU	120.00	190.00	vendido	2026-02-14 00:26:15	2026-02-14 00:26:50
601	FUNDA_SILIC_1	funda	FUNDA SILICONA IP X/XS	GZ STORES	20.00	60.00	disponible	2026-02-14 18:42:33	2026-02-14 18:42:33
602	FUNDA_SILIC_2	funda	FUNDA SILICONA IP X/XS	GZ STORES	20.00	60.00	disponible	2026-02-14 18:42:58	2026-02-14 18:42:58
603	FUNDA_SILIC_3	funda	FUNDA SILICONA IP X/XS	GZ STORES	20.00	60.00	disponible	2026-02-14 18:43:11	2026-02-14 18:43:11
604	FUNDA_SILIC_5	funda	FUNDA SILICONA IP XS MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 19:12:06	2026-02-14 19:12:06
605	FUNDA_SILIC_4	funda	FUNDA SILICONA IP XS MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 19:12:20	2026-02-14 19:12:20
606	FundaSili:2	funda	FUNDA SILICONA IP XS MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 19:14:56	2026-02-14 19:14:56
607	FUNDA_SIL_342	funda	FUNDA SILICONA IP XS MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 19:15:16	2026-02-14 19:15:16
608	FUNDA_SIL_295	funda	FUNDA SILICONA IP XS MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 19:15:32	2026-02-14 19:15:32
609	FUNDA_SIL_310	funda	FUNDA SILICONA IP XS MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 19:15:46	2026-02-14 19:15:46
610	FUNDA_SIL_337	funda	FUNDA SILICONA IP XS MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 19:16:00	2026-02-14 19:16:00
611	FUNDA_SIL_351	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:17:20	2026-02-14 19:17:20
612	FUNDA_SIL_327	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:17:31	2026-02-14 19:17:31
613	FUNDA_SIL_349	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:17:47	2026-02-14 19:17:47
614	FUNDA_SIL_340	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:18:04	2026-02-14 19:18:04
615	FundaSili:237	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:24:09	2026-02-14 19:24:09
616	FUNDA_SIL_347	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:27:48	2026-02-14 19:27:48
617	FUNDA_SIL_339	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:29:20	2026-02-14 19:29:20
618	FUNDA_SIL_328	funda	FUNDA SILICONA IP XR	GZ STORE	20.00	60.00	disponible	2026-02-14 19:30:20	2026-02-14 19:30:20
619	FUNDA_SIL_350	funda	FUNDA SILICONA IP XR	GZ STORE	20.00	60.00	disponible	2026-02-14 19:30:31	2026-02-14 19:30:31
620	FUNDA_SIL_330	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:33:24	2026-02-14 19:33:24
621	FUNDA_SIL_334	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:33:29	2026-02-14 19:33:29
622	FUNDA_SIL_333	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:33:34	2026-02-14 19:33:34
623	FUNDA_SIL_332	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:33:40	2026-02-14 19:33:40
624	FUNDA_SIL_329	funda	FUNDA SILICONA IP XR	GZ STORES	20.00	60.00	disponible	2026-02-14 19:35:22	2026-02-14 19:35:22
625	FUNDA_SILIC_148	funda	FUNDA SILICONA IP 6S	GZ STORES	20.00	60.00	disponible	2026-02-14 19:37:49	2026-02-14 19:37:49
626	FUNDA_SILIC_147	funda	FUNDA SILICONA IP 6S	GZ STORES	20.00	60.00	disponible	2026-02-14 19:42:56	2026-02-14 19:42:56
627	FUNDASILI:11	funda	FUNDA SILICONA IP 7 PLUS / 8 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 19:43:29	2026-02-14 19:43:29
628	FUNDASILI:241	funda	FUNDA SILICONA IP 7 PLUS / 8 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 19:47:03	2026-02-14 19:47:03
629	FUNDA_SILIC_6	funda	FUNDA SILICONA IP 11	GZ STORES	20.00	60.00	disponible	2026-02-14 19:47:57	2026-02-14 19:47:57
630	FUNDA_SILIC_7	funda	FUNDA_SILIC_7	GZ STORES	20.00	60.00	disponible	2026-02-14 20:19:47	2026-02-14 20:19:47
631	FUNDA_SILIC_8	funda	FUNDA SILICONA IP 11	GZ STORES	20.00	60.00	disponible	2026-02-14 20:25:49	2026-02-14 20:25:49
632	FUNDA_SILIC_9	funda	FUNDA SILICONA IP 11	GZ STORES	20.00	60.00	disponible	2026-02-14 20:26:00	2026-02-14 20:26:00
634	FUNDA_SILIC_11	funda	FUNDA SILICONA IP 11	GZ STORES	20.00	60.00	disponible	2026-02-14 20:29:53	2026-02-14 20:29:53
635	FUNDASILI:251	funda	FUNDA SILICONA IP 11	GZ STORES	20.00	60.00	disponible	2026-02-14 20:34:19	2026-02-14 20:34:19
636	FUNDA_SIL_251	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:42:06	2026-02-14 20:42:06
637	FUNDA_SIL_252	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:42:23	2026-02-14 20:42:23
638	FUNDA_SIL_250	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:42:31	2026-02-14 20:42:31
639	FUNDASILI:13	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:42:36	2026-02-14 20:42:36
640	FUNDA_SIL_345	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:42:40	2026-02-14 20:42:40
641	FUNDA_SIL_326	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:42:43	2026-02-14 20:42:43
642	FUNDA_SIL_325	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:42:46	2026-02-14 20:42:46
643	FUNDA_SIL_324	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:42:51	2026-02-14 20:42:51
644	FUNDA_SIL_322	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:42:55	2026-02-14 20:42:55
645	FUNDASILI:111	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:42:57	2026-02-14 20:42:57
646	FUNDA_SILIC_144	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:43:00	2026-02-14 20:43:00
647	FUNDA_SILIC_145	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:43:03	2026-02-14 20:43:03
648	FUNDA_SILIC_146	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:43:06	2026-02-14 20:43:06
649	FUNDA_SILIC_143	funda	FUNDA SILICONA IP 11 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:43:15	2026-02-14 20:43:15
650	FUNDASILI:31	funda	FUNDA SILICONA IP 11 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:45:46	2026-02-14 20:45:46
651	FUNDA_SILM_4	funda	FUNDA SILICONA IP 11 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:46:03	2026-02-14 20:46:03
652	FUNDA_SILM_3	funda	FUNDA SILICONA IP 11 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:46:09	2026-02-14 20:46:09
653	FUNDA_SILM_5	funda	FUNDA SILICONA IP 11 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:46:27	2026-02-14 20:46:27
654	FUNDA_SILM_7	funda	FUNDA SILICONA IP 11 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:46:34	2026-02-14 20:46:34
655	FUNDASILI:205	funda	FUNDA SILICONA IP 11 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:46:41	2026-02-14 20:46:41
656	FUNDA_SIL_346	funda	FUNDA SILICONA IP 11 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:46:48	2026-02-14 20:46:48
657	FUNDA_SIL_255	funda	FUNDA SILICONA IP 11 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:46:59	2026-02-14 20:46:59
658	FUNDA_SIL_254	funda	FUNDA SILICONA IP 11 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:47:02	2026-02-14 20:47:02
659	FUNDA_SIL_253	funda	FUNDA SILICONA IP 11 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:47:06	2026-02-14 20:47:06
660	FUNDASILI:263	funda	FUNDA SILICONA IP 11 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:47:11	2026-02-14 20:47:11
661	FUNDA_SILM_12	funda	FUNDA SILICONA IP 12	GZ STORES	20.00	60.00	disponible	2026-02-14 20:48:40	2026-02-14 20:48:40
662	FUNDA_SILM_11	funda	FUNDA SILICONA IP 12	GZ STORES	20.00	60.00	disponible	2026-02-14 20:48:44	2026-02-14 20:48:44
663	FUNDA_SIL_299	funda	FUNDA SILICONA IP 12	GZ STORES	20.00	60.00	disponible	2026-02-14 20:48:49	2026-02-14 20:48:49
664	FUNDA_SIL_279	funda	FUNDA SILICONA IP 12	GZ STORES	20.00	60.00	disponible	2026-02-14 20:48:52	2026-02-14 20:48:52
665	FUNDA_SIL_407	funda	FUNDA SILICONA IP 12	GZ STORES	20.00	60.00	disponible	2026-02-14 20:48:56	2026-02-14 20:48:56
666	FUNDA_SIL_406	funda	FUNDA SILICONA IP 12	GZ STORES	20.00	60.00	disponible	2026-02-14 20:49:00	2026-02-14 20:49:00
667	FUNDA_SILM_10	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:49:54	2026-02-14 20:49:54
668	FUNDA_SILM_9	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:49:57	2026-02-14 20:49:57
669	FUNDA_SIL_276	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:50:01	2026-02-14 20:50:01
670	FUNDA_SIL_274	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:50:04	2026-02-14 20:50:04
671	FUNDA_SIL_275	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:50:07	2026-02-14 20:50:07
672	FUNDA_SIL_273	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:50:09	2026-02-14 20:50:09
673	FUNDA_SILIC_14	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:50:12	2026-02-14 20:50:12
674	FUNDA_SILIC_12	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:50:15	2026-02-14 20:50:15
676	FUNDA_SIL_408	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:50:20	2026-02-14 20:50:20
677	FUNDA_SIL_409	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:50:23	2026-02-14 20:50:23
678	FUNDA_SIL_411	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:50:28	2026-02-14 20:50:28
679	FUNDA_SILM_16	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:52:03	2026-02-14 20:52:03
680	FUNDASILI:32	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:52:06	2026-02-14 20:52:06
681	FUNDA_SIL_263	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:52:26	2026-02-14 20:52:26
682	FUNDA_SILIC_149	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:52:41	2026-02-14 20:52:41
683	FUNDA_SIL_262	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:52:44	2026-02-14 20:52:44
684	FUNDA_SIL_264	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:52:48	2026-02-14 20:52:48
685	FUNDA_SIL_258	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:52:51	2026-02-14 20:52:51
686	FUNDA_SILIC_150	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:53:10	2026-02-14 20:53:10
687	FUNDA_SILIC_151	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:53:23	2026-02-14 20:53:23
688	FUNDA_SIL_319	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:53:26	2026-02-14 20:53:26
689	FUNDASILI:196	funda	FUNDA SILICONA IP 12 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:53:31	2026-02-14 20:53:31
690	FUNDA_SIL_268	funda	FUNDA SILICONA IP 13/14	GZ STORES	20.00	60.00	disponible	2026-02-14 20:55:06	2026-02-14 20:55:06
691	FUNDA_SIL_266	funda	FUNDA SILICONA IP 13/14	GZ STORES	20.00	60.00	disponible	2026-02-14 20:55:09	2026-02-14 20:55:09
692	FUNDA_SILIC_16	funda	FUNDA SILICONA IP 13/14	GZ STORES	20.00	60.00	disponible	2026-02-14 20:55:12	2026-02-14 20:55:12
693	FUNDA_SILIC_17	funda	FUNDA SILICONA IP 13/14	GZ STORES	20.00	60.00	disponible	2026-02-14 20:55:14	2026-02-14 20:55:14
694	FUNDA_SILIC_18	funda	FUNDA SILICONA IP 13/14	GZ STORES	20.00	60.00	disponible	2026-02-14 20:55:17	2026-02-14 20:55:17
695	FUNDA_SILIC_19	funda	FUNDA SILICONA IP 13/14	GZ STORES	20.00	60.00	disponible	2026-02-14 20:55:23	2026-02-14 20:55:23
696	FUNDA_SILIC_20	funda	FUNDA SILICONA IP 13/14	GZ STORES	20.00	60.00	disponible	2026-02-14 20:55:26	2026-02-14 20:55:26
697	FUNDA_SILIC_21	funda	FUNDA SILICONA IP 13/14	GZ STORES	20.00	60.00	disponible	2026-02-14 20:55:30	2026-02-14 20:55:30
698	FUNDA_SILIC_22	funda	FUNDA SILICONA IP 13/14	GZ STORES	20.00	60.00	disponible	2026-02-14 20:55:33	2026-02-14 20:55:33
699	FUNDA_SILIC_23	funda	FUNDA SILICONA IP 13/14	GZ STORES	20.00	60.00	disponible	2026-02-14 20:55:36	2026-02-14 20:55:36
700	FUNDA_SILIC_24	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:56:35	2026-02-14 20:56:35
701	FUNDA_SILIC_25	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:56:36	2026-02-14 20:56:36
702	FUNDA_SILIC_26	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:56:39	2026-02-14 20:56:39
703	FUNDA_SILIC_27	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:56:41	2026-02-14 20:56:41
704	FUNDA_SILIC_28	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:56:43	2026-02-14 20:56:43
705	FUNDA_SILIC_29	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:56:46	2026-02-14 20:56:46
707	FUNDA_SILIC_31	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:56:51	2026-02-14 20:56:51
708	FUNDA_SILM_31	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:56:54	2026-02-14 20:56:54
709	FUNDA_SILM_25	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:56:56	2026-02-14 20:56:56
710	FUNDA_SIL_298	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:57:00	2026-02-14 20:57:00
711	FUNDA_SIL_296	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:57:02	2026-02-14 20:57:02
712	FUNDA_SIL_305	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:57:06	2026-02-14 20:57:06
713	FUNDA_SIL_297	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:57:09	2026-02-14 20:57:09
714	FUNDA_SIL_306	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:57:24	2026-02-14 20:57:24
715	FUNDA_SILIC_32	funda	FUNDA SILICONA IP 13 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:58:11	2026-02-14 20:58:11
716	FUNDA_SILIC_33	funda	FUNDA SILICONA IP 13 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:58:14	2026-02-14 20:58:14
717	FUNDA_SILIC_34	funda	FUNDA SILICONA IP 13 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:58:16	2026-02-14 20:58:16
718	FUNDA_SILIC_35	funda	FUNDA SILICONA IP 13 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:58:18	2026-02-14 20:58:18
719	FUNDA_SILIC_36	funda	FUNDA SILICONA IP 13 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:58:20	2026-02-14 20:58:20
720	FUNDA_SILIC_37	funda	FUNDA SILICONA IP 13 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:58:22	2026-02-14 20:58:22
721	FUNDA_SILM_18	funda	FUNDA SILICONA IP 13 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:58:27	2026-02-14 20:58:27
722	FUNDA_SIL_294	funda	FUNDA SILICONA IP 13 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:58:39	2026-02-14 20:58:39
723	FUNDASILI:33	funda	FUNDA SILICONA IP 13 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:58:43	2026-02-14 20:58:43
724	FUNDA_SIL_293	funda	FUNDA SILICONA IP 13 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 20:58:46	2026-02-14 20:58:46
725	FUNDA_SILM_47	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:59:42	2026-02-14 20:59:42
726	FUNDA_SILM_48	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:59:44	2026-02-14 20:59:44
727	FUNDA_SILM_50	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:59:47	2026-02-14 20:59:47
728	FUNDA_SILIC_38	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:59:49	2026-02-14 20:59:49
729	FUNDA_SILIC_39	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:59:51	2026-02-14 20:59:51
730	FUNDA_SILIC_40	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:59:54	2026-02-14 20:59:54
731	FUNDA_SILIC_41	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:59:55	2026-02-14 20:59:55
732	FUNDA_SILIC_42	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 20:59:58	2026-02-14 20:59:58
733	FUNDA_SIL_302	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:00:02	2026-02-14 21:00:02
734	FUNDA_SIL_301	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:00:05	2026-02-14 21:00:05
735	FUNDA_SIL_246	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:00:32	2026-02-14 21:00:32
736	FUNDA_SIL_270	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:00:36	2026-02-14 21:00:36
737	FUNDA_SIL_320	funda	FUNDA SILICONA IP 14 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:00:41	2026-02-14 21:00:41
738	FUNDA_SIL_259	funda	FUNDA SILICONA IP 14 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:03:03	2026-02-14 21:03:03
739	FUNDA_SIL_257	funda	FUNDA SILICONA IP 14 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:03:05	2026-02-14 21:03:05
740	FUNDA_SIL_261	funda	FUNDA SILICONA IP 14 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:03:08	2026-02-14 21:03:08
741	FUNDA_SILIC_48	funda	FUNDA SILICONA IP 14 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:03:11	2026-02-14 21:03:11
742	FUNDA_SILIC_51	funda	FUNDA SILICONA IP 14 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:03:14	2026-02-14 21:03:14
754	FUNDA_SIL_309	funda	FUNDA SILICONA IP 15	GZ STORES	20.00	60.00	vendido	2026-02-14 21:07:11	2026-03-20 13:11:11
743	FUNDA_SILIC_43	funda	FUNDA SILICONA IP 14 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:04:06	2026-02-14 21:04:45
745	FUNDA_SILIC_45	funda	FUNDA SILICONA IP 14 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:05:12	2026-02-14 21:05:12
746	FUNDA_SILIC_46	funda	FUNDA SILICONA IP 14 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:05:15	2026-02-14 21:05:15
747	FUNDASILI:27	funda	FUNDA SILICONA IP 14 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:05:18	2026-02-14 21:05:18
748	FUNDA_SILM_57	funda	FUNDA SILICONA IP 14 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:05:37	2026-02-14 21:05:37
750	FUNDA_SIL_265	funda	FUNDA SILICONA IP 14 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:05:44	2026-02-14 21:05:44
751	FUNDA_SIL_287	funda	FUNDA SILICONA IP 14 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:05:47	2026-02-14 21:05:47
752	FUNDA_SIL_288	funda	FUNDA SILICONA IP 14 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:05:52	2026-02-14 21:05:52
755	FUNDA_SILIC_52	funda	FUNDA SILICONA IP 15	GZ STORES	20.00	60.00	disponible	2026-02-14 21:07:13	2026-02-14 21:07:13
756	FUNDA_SILIC_53	funda	FUNDA SILICONA IP 15	GZ STORES	20.00	60.00	disponible	2026-02-14 21:07:16	2026-02-14 21:07:16
757	FUNDA_SILIC_54	funda	FUNDA SILICONA IP 15	GZ STORES	20.00	60.00	disponible	2026-02-14 21:07:19	2026-02-14 21:07:19
758	FUNDA_SILIC_55	funda	FUNDA SILICONA IP 15	GZ STORES	20.00	60.00	disponible	2026-02-14 21:07:21	2026-02-14 21:07:21
759	FUNDA_SILIC_56	funda	FUNDA SILICONA IP 15	GZ STORES	20.00	60.00	disponible	2026-02-14 21:07:23	2026-02-14 21:07:23
760	FUNDA_SILIC_57	funda	FUNDA SILICONA IP 15	GZ STORES	20.00	60.00	disponible	2026-02-14 21:07:25	2026-02-14 21:07:25
761	FUNDA_SILIC_58	funda	FUNDA SILICONA IP 15	GZ STORES	20.00	60.00	disponible	2026-02-14 21:07:26	2026-02-14 21:07:26
762	FUNDA_SILIC_47	funda	FUNDA SILICONA IP 15 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:08:01	2026-02-14 21:08:01
763	FUNDA_SILIC_49	funda	FUNDA SILICONA IP 15 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:08:04	2026-02-14 21:08:04
764	FUNDA_SILIC_50	funda	FUNDA SILICONA IP 15 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:08:08	2026-02-14 21:08:08
765	FUNDA_SIL_377	funda	FUNDA SILICONA IP 15 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:08:12	2026-02-14 21:08:12
766	FUNDA_SIL_376	funda	FUNDA SILICONA IP 15 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:08:14	2026-02-14 21:08:14
767	FUNDA_SIL_374	funda	FUNDA SILICONA IP 15 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:08:17	2026-02-14 21:08:17
768	FUNDA_SIL_375	funda	FUNDA SILICONA IP 15 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:08:20	2026-02-14 21:08:20
769	FUNDA_SIL_378	funda	FUNDA SILICONA IP 15 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:08:23	2026-02-14 21:08:23
770	FUNDA_SIL_379	funda	FUNDA SILICONA IP 15 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:08:26	2026-02-14 21:08:26
771	FUNDA_SIL_316	funda	FUNDA SILICONA IP 15 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:08:40	2026-02-14 21:08:40
772	FUNDA_SILIC_152	funda	FUNDA SILICONA IP 15 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:08:53	2026-02-14 21:08:53
773	FUNDA_SILM_46	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:07	2026-02-14 21:10:07
774	FUNDA_SIL_315	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:10	2026-02-14 21:10:10
753	FUNDA_SIL_312	funda	FUNDA SILICONA IP 15	GZ STORES	20.00	60.00	vendido	2026-02-14 21:07:07	2026-02-15 21:31:24
1236	FUNDA_SILIC_169	funda	FUNDA DE SILICONA IP 12/12 PRO	CHINA	20.00	60.00	disponible	2026-02-16 13:20:48	2026-02-16 13:20:48
1240	FUNDASILI:83	funda	FUNDA DE SILICONA IP X/XS	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:22:42	2026-02-16 13:22:42
744	FUNDA_SILIC_44	funda	FUNDA SILICONA IP 14 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-14 21:04:16	2026-03-09 10:46:27
775	FUNDA_SIL_365	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:15	2026-02-14 21:10:15
776	FUNDA_SIL_367	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:18	2026-02-14 21:10:18
777	FUNDA_SIL_368	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:21	2026-02-14 21:10:21
778	FUNDA_SIL_321	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:23	2026-02-14 21:10:23
779	FUNDA_SILIC_59	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:26	2026-02-14 21:10:26
780	FUNDA_SILIC_60	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:29	2026-02-14 21:10:29
781	FUNDA_SILIC_61	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:32	2026-02-14 21:10:32
782	FUNDA_SILIC_62	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:35	2026-02-14 21:10:35
783	FUNDA_SILIC_63	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:49	2026-02-14 21:10:49
784	FUNDA_SILIC_64	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:52	2026-02-14 21:10:52
785	FUNDA_SILIC_65	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:55	2026-02-14 21:10:55
786	FUNDA_SILIC_66	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:10:59	2026-02-14 21:10:59
787	FUNDA_SILIC_67	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:11:05	2026-02-14 21:11:05
788	FUNDA_SILIC_68	funda	FUNDA SILICONA IP 15 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:11:09	2026-02-14 21:11:09
789	FUNDA_SILM_59	funda	FUNDA SILICONA IP 15 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:12:29	2026-02-14 21:12:29
790	FUNDA_SIL_260	funda	FUNDA SILICONA IP 15 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:12:31	2026-02-14 21:12:31
792	FUNDA_SILIC_70	funda	FUNDA SILICONA IP 15 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:12:35	2026-02-14 21:12:35
793	FUNDA_SILIC_71	funda	FUNDA SILICONA IP 15 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:12:37	2026-02-14 21:12:37
794	FUNDA_SILIC_72	funda	FUNDA SILICONA IP 15 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:12:38	2026-02-14 21:12:38
796	FUNDA_SILIC_74	funda	FUNDA SILICONA IP 15 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:12:43	2026-02-14 21:12:43
797	FUNDA_SILIC_75	funda	FUNDA SILICONA IP 15 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:12:46	2026-02-14 21:12:46
798	FUNDA_SIL_389	funda	FUNDA SILICONA IP 16	GZ STORES	20.00	60.00	disponible	2026-02-14 21:16:08	2026-02-14 21:16:08
799	FUNDA_SILIC_84	funda	FUNDA SILICONA IP 16	GZ STORES	20.00	60.00	disponible	2026-02-14 21:16:11	2026-02-14 21:16:11
800	FUNDA_SILIC_76	funda	FUNDA SILICONA IP 16	GZ STORES	20.00	60.00	disponible	2026-02-14 21:16:14	2026-02-14 21:16:14
801	FUNDA_SILIC_77	funda	FUNDA SILICONA IP 16	GZ STORES	20.00	60.00	disponible	2026-02-14 21:16:34	2026-02-14 21:16:34
802	FUNDA_SILIC_78	funda	FUNDA SILICONA IP 16	GZ STORES	20.00	60.00	disponible	2026-02-14 21:16:38	2026-02-14 21:16:38
803	FUNDA_SILIC_79	funda	FUNDA SILICONA IP 16	GZ STORES	20.00	60.00	disponible	2026-02-14 21:16:42	2026-02-14 21:16:42
804	FUNDA_SILIC_80	funda	FUNDA SILICONA IP 16	GZ STORES	20.00	60.00	disponible	2026-02-14 21:16:46	2026-02-14 21:16:46
805	FUNDA_SILIC_82	funda	FUNDA SILICONA IP 16	GZ STORES	20.00	60.00	disponible	2026-02-14 21:16:53	2026-02-14 21:16:53
806	FUNDA_SILIC_83	funda	FUNDA SILICONA IP 16	GZ STORES	20.00	60.00	disponible	2026-02-14 21:16:58	2026-02-14 21:16:58
807	FUNDA_SIL_385	funda	FUNDA SILICONA IP 16	GZ STORES	20.00	60.00	disponible	2026-02-14 21:17:02	2026-02-14 21:17:02
808	FUNDA_SILIC_153	funda	FUNDA SILICONA IP 16 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:18:10	2026-02-14 21:18:10
809	FUNDA_SILIC_85	funda	FUNDA SILICONA IP 16 PLUS	GZ STORES	20.00	60.00	disponible	2026-02-14 21:18:14	2026-02-14 21:18:14
810	FUNDA_SILIC_86	funda	FUNDA SILICONA IP 16 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:18:41	2026-02-14 21:18:41
811	FUNDA_SILIC_87	funda	FUNDA SILICONA IP 16 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:18:42	2026-02-14 21:18:42
812	FUNDA_SILIC_88	funda	FUNDA SILICONA IP 16 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:18:49	2026-02-14 21:18:49
813	FUNDA_SILIC_89	funda	FUNDA SILICONA IP 16 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:18:52	2026-02-14 21:18:52
814	FUNDA_SILIC_90	funda	FUNDA SILICONA IP 16 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:18:56	2026-02-14 21:18:56
815	FUNDA_SILIC_91	funda	FUNDA SILICONA IP 16 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:18:58	2026-02-14 21:18:58
816	FUNDA_SILIC_92	funda	FUNDA SILICONA IP 16 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:19:00	2026-02-14 21:19:00
817	FUNDA_SILIC_93	funda	FUNDA SILICONA IP 16 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:19:02	2026-02-14 21:19:02
818	FUNDA_SIL_393	funda	FUNDA SILICONA IP 16 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:19:04	2026-02-14 21:19:04
819	FUNDA_SILIC_94	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:20:00	2026-02-14 21:20:00
820	FUNDA_SILIC_95	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:20:03	2026-02-14 21:20:03
821	FUNDA_SILIC_96	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:20:05	2026-02-14 21:20:05
822	FUNDA_SILIC_97	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:20:08	2026-02-14 21:20:08
823	FUNDA_SILIC_98	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:20:11	2026-02-14 21:20:11
824	FUNDA_SILIC_99	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:20:13	2026-02-14 21:20:13
825	FUNDA_SILIC_100	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:20:15	2026-02-14 21:20:15
827	FUNDA_SILIC_102	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:20:19	2026-02-14 21:20:19
828	FUNDA_SILIC_103	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:20:23	2026-02-14 21:20:23
830	FUNDA_SILIC_138	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:20:32	2026-02-14 21:20:32
831	FUNDA_SILIC_139	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:21:05	2026-02-14 21:21:05
833	FUNDA_SILIC_141	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:21:19	2026-02-14 21:21:19
834	FUNDA_SILIC_142	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:21:29	2026-02-14 21:21:29
826	FUNDA_SILIC_101	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-14 21:20:17	2026-03-09 09:37:27
829	FUNDA_SIL_395	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-14 21:20:30	2026-03-24 19:38:26
832	FUNDA_SILIC_140	funda	FUNDA SILICONA IP 16 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-14 21:21:13	2026-03-31 17:16:03
791	FUNDA_SILIC_69	funda	FUNDA SILICONA IP 15 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-14 21:12:33	2026-03-31 18:18:24
835	FUNDA_SILIC_104	funda	FUNDA SILICONA IP 17	GZ STORES	20.00	60.00	disponible	2026-02-14 21:22:32	2026-02-14 21:22:32
837	FUNDA_SILIC_107	funda	FUNDA SILICONA IP 17 AIR	GZ STORES	20.00	60.00	disponible	2026-02-14 21:23:28	2026-02-14 21:23:28
838	FUNDA_SILIC_108	funda	FUNDA SILICONA IP 17 AIR	GZ STORES	20.00	60.00	disponible	2026-02-14 21:23:30	2026-02-14 21:23:30
839	FUNDA_SILIC_109	funda	FUNDA SILICONA IP 17 AIR	GZ STORES	20.00	60.00	disponible	2026-02-14 21:23:33	2026-02-14 21:23:33
840	FUNDA_SILIC_110	funda	FUNDA SILICONA IP 17 AIR	GZ STORES	20.00	60.00	disponible	2026-02-14 21:23:34	2026-02-14 21:23:34
841	FUNDA_SILIC_111	funda	FUNDA SILICONA IP 17 AIR	GZ STORES	20.00	60.00	disponible	2026-02-14 21:23:35	2026-02-14 21:23:35
842	FUNDA_SILIC_112	funda	FUNDA SILICONA IP 17 AIR	GZ STORES	20.00	60.00	disponible	2026-02-14 21:23:37	2026-02-14 21:23:37
843	FUNDA_SILIC_113	funda	FUNDA SILICONA IP 17 AIR	GZ STORES	20.00	60.00	disponible	2026-02-14 21:23:39	2026-02-14 21:23:39
844	FUNDA_SILIC_114	funda	FUNDA SILICONA IP 17 AIR	GZ STORES	20.00	60.00	disponible	2026-02-14 21:23:41	2026-02-14 21:23:41
845	FUNDA_SILIC_115	funda	FUNDA SILICONA IP 17 AIR	GZ STORES	20.00	60.00	disponible	2026-02-14 21:23:43	2026-02-14 21:23:43
846	FUNDA_SILIC_116	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:24:17	2026-02-14 21:24:17
847	FUNDA_SILIC_117	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:24:20	2026-02-14 21:24:20
848	FUNDA_SILIC_118	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:24:22	2026-02-14 21:24:22
849	FUNDA_SILIC_119	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:24:24	2026-02-14 21:24:24
850	FUNDA_SILIC_120	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:24:25	2026-02-14 21:24:25
851	FUNDA_SILIC_121	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:24:27	2026-02-14 21:24:27
852	FUNDA_SILIC_122	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:24:29	2026-02-14 21:24:29
854	FUNDA_SILIC_124	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:24:32	2026-02-14 21:24:32
855	FUNDA_SILIC_125	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:24:34	2026-02-14 21:24:34
856	FUNDA_SILIC_126	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	disponible	2026-02-14 21:24:37	2026-02-14 21:24:37
857	FUNDA_SILIC_127	funda	FUNDA SILICONA IP 17 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:25:13	2026-02-14 21:25:13
858	FUNDA_SILIC_128	funda	FUNDA SILICONA IP 17 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:25:16	2026-02-14 21:25:16
860	FUNDA_SILIC_130	funda	FUNDA SILICONA IP 17 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:25:20	2026-02-14 21:25:20
861	FUNDA_SILIC_131	funda	FUNDA SILICONA IP 17 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:25:23	2026-02-14 21:25:23
862	_SILIC_132	funda	FUNDA SILICONA IP 17 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:25:25	2026-02-14 21:25:25
864	FUNDA_SILIC_134	funda	FUNDA SILICONA IP 17 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:25:29	2026-02-14 21:25:29
866	FUNDA_SILIC_137	funda	FUNDA SILICONA IP 17 PRO MAX	GZ STORES	20.00	60.00	disponible	2026-02-14 21:25:36	2026-02-14 21:25:36
391	CUBO20W: 11	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:19:19	2026-02-14 21:40:56
405	CABLELIGHT: 4	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	vendido	2026-02-04 18:29:20	2026-02-14 21:40:56
1237	FUNDA_SILIC_170	funda	FUNDA DE SILICONA IP 12/12 PRO	CHINA	20.00	60.00	disponible	2026-02-16 13:20:52	2026-02-16 13:20:52
207	VIDRIOTEMSA:189	vidrio_templado	Vidrio Templado IP 17 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:39:03	2026-02-14 21:58:24
867	FUNDA_SILIC_135	funda	FUNDA SILICONA IP 17 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-14 21:46:20	2026-02-14 21:58:24
868	FUNDA_SILIC_105	funda	FUNDA SILICONA IP 17	GZ STORES	20.00	60.00	vendido	2026-02-14 21:46:35	2026-02-14 22:04:45
413	CABLELIGHT: 12	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	vendido	2026-02-04 18:33:24	2026-02-14 22:08:30
869	FUNDA_SILIC_81	funda	FUNDA SILICONA IP 16	GZ STORES	20.00	60.00	vendido	2026-02-14 21:46:48	2026-02-14 22:15:54
870	FUNDA_SILIC_15	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	vendido	2026-02-14 21:47:06	2026-02-14 22:18:46
80	VIDRIOTEMSA:16	vidrio_templado	Vidrio Templado IP 12/12PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 12:24:19	2026-02-14 22:18:46
155	VIDRIOTEMSA:96	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:12:28	2026-02-15 21:31:24
871	FUNDA_AYE_3	funda	Funda de Diseño IP 7/8 PLUS	Ayelen Vargas	10.00	70.00	disponible	2026-02-16 11:58:52	2026-02-16 11:58:52
872	FUNDADISEN:10	funda	Funda de Diseño IP 7/8 PLUS	CHINA	35.00	70.00	disponible	2026-02-16 11:59:23	2026-02-16 11:59:23
873	FUNDA_DISE_249	funda	Funda de Diseño IP XS MAX	CHINA	35.00	70.00	disponible	2026-02-16 11:59:37	2026-02-16 11:59:37
874	FUNDADISEN:2	funda	Funda de Diseño IP XS MAX	CHINA	35.00	70.00	disponible	2026-02-16 11:59:42	2026-02-16 11:59:42
875	FUNDA_DISE_253	funda	Funda de Diseño IP 11	CHINA	35.00	70.00	disponible	2026-02-16 11:59:57	2026-02-16 11:59:57
876	FUNDA_DISE_252	funda	Funda de Diseño IP 11	CHINA	35.00	70.00	disponible	2026-02-16 12:00:01	2026-02-16 12:00:01
877	FUNDA_DISE_250	funda	Funda de Diseño IP 11	CHINA	35.00	70.00	disponible	2026-02-16 12:00:06	2026-02-16 12:00:06
878	FUNDA_DISE_254	funda	Funda de Diseño IP 11	CHINA	35.00	70.00	disponible	2026-02-16 12:00:13	2026-02-16 12:00:13
879	FUNDA_DISE_256	funda	Funda de Diseño IP 11	CHINA	35.00	70.00	disponible	2026-02-16 12:00:18	2026-02-16 12:00:18
880	FUNDA_DISE_257	funda	Funda de Diseño IP 11	CHINA	35.00	70.00	disponible	2026-02-16 12:00:23	2026-02-16 12:00:23
881	FUNDA_DISE_251	funda	Funda de Diseño IP 11	CHINA	35.00	70.00	disponible	2026-02-16 12:00:26	2026-02-16 12:00:26
882	FUNDA_DISE_214	funda	Funda de Diseño IP 11	CHINA	35.00	70.00	disponible	2026-02-16 12:00:30	2026-02-16 12:00:30
883	FUNDA_DISE_212	funda	Funda de Diseño IP 11	CHINA	35.00	70.00	disponible	2026-02-16 12:00:35	2026-02-16 12:00:35
884	FUNDA_DISE_213	funda	Funda de Diseño IP 11	CHINA	35.00	70.00	disponible	2026-02-16 12:00:39	2026-02-16 12:00:39
1241	FUNDASILI:226	funda	FUNDA DE SILICONA IP XR	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:22:56	2026-02-16 13:22:56
1243	FUNDASILI:225	funda	FUNDA DE SILICONA IP XR	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:03	2026-02-16 13:23:03
1245	FUNDASILI:228	funda	FUNDA DE SILICONA IP XR	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:08	2026-02-16 13:23:08
1247	FUNDASILI:232	funda	FUNDA DE SILICONA IP XR	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:13	2026-02-16 13:23:13
853	FUNDA_SILIC_123	funda	FUNDA SILICONA IP 17 PRO	GZ STORES	20.00	60.00	vendido	2026-02-14 21:24:30	2026-03-09 19:28:49
865	FUNDA_SILIC_136	funda	FUNDA SILICONA IP 17 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-14 21:25:31	2026-03-09 19:39:18
836	FUNDA_SILIC_106	funda	FUNDA SILICONA IP 17	GZ STORES	20.00	60.00	vendido	2026-02-14 21:22:45	2026-03-10 09:23:57
885	FUNDADISEN:43	funda	Funda de Diseño IP 11 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:01:12	2026-02-16 12:01:12
886	FUNDADISEN:56	funda	Funda de Diseño IP 11 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:01:16	2026-02-16 12:01:16
887	FUNDADISEN:55	funda	Funda de Diseño IP 11 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:01:20	2026-02-16 12:01:20
888	FUNDADISENO:98	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:01:39	2026-02-16 12:01:39
889	FUNDADISENO:105	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:01:47	2026-02-16 12:01:47
890	FUNDADISENO:108	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:01:59	2026-02-16 12:01:59
891	FUNDADISENO:107	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:02:02	2026-02-16 12:02:02
892	FUNDADISENO:19	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:02:05	2026-02-16 12:02:05
893	FUNDADISENO:103	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:02:13	2026-02-16 12:02:13
894	FUNDADISENO:17	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:02:33	2026-02-16 12:02:33
895	FUNDADISENO:15	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:02:37	2026-02-16 12:02:37
896	FUNDADISENO:16	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:02:41	2026-02-16 12:02:41
897	FUNDADISENO:106	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:02:45	2026-02-16 12:02:45
898	FUNDADISENO:101	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:02:49	2026-02-16 12:02:49
899	FUNDADISEN:86	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:02:52	2026-02-16 12:02:52
900	FUNDA_DISE_241	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:02:56	2026-02-16 12:02:56
901	FUNDADISEN:83	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:03:18	2026-02-16 12:03:18
902	FUNDADISEN:87	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:03:22	2026-02-16 12:03:22
903	FUNDADISENO:99	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:03:25	2026-02-16 12:03:25
904	FUNDADISENO:102	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:03:29	2026-02-16 12:03:29
905	FUNDADISEN:81	funda	Funda de Diseño IP 11 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:03:32	2026-02-16 12:03:32
906	FUNDA_DISE_243	funda	Funda de Diseño IP 12/12PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:04:01	2026-02-16 12:04:01
908	FUNDA_DISE_247	funda	Funda de Diseño IP 12/12PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:04:08	2026-02-16 12:04:08
909	FUNDA_DISE_246	funda	Funda de Diseño IP 12/12PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:04:12	2026-02-16 12:04:12
910	FUNDADISEN:58	funda	Funda de Diseño IP 12/12PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:04:17	2026-02-16 12:04:17
911	FUNDADISENO:9	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:04:48	2026-02-16 12:04:48
912	FUNDADISENO:14	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:04:52	2026-02-16 12:04:52
913	FUNDADISENO:11	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:04:55	2026-02-16 12:04:55
914	FUNDADISENO:89	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:04:58	2026-02-16 12:04:58
915	FUNDADISEN:124	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:05:01	2026-02-16 12:05:01
916	FUNDADISEN:126	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:05:32	2026-02-16 12:05:32
917	FUNDADISEN:125	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:05:36	2026-02-16 12:05:36
918	FUNDADISEN:131	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:05:41	2026-02-16 12:05:41
919	FUNDADISEN:127	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:05:45	2026-02-16 12:05:45
920	FUNDA_DISE_125	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:05:48	2026-02-16 12:05:48
921	FUNDADISENO:86	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:05:52	2026-02-16 12:05:52
922	FUNDADISEN:102	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:05:56	2026-02-16 12:05:56
923	FUNDADISEN:95	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:06:15	2026-02-16 12:06:15
924	FUNDADISEN:101	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:06:19	2026-02-16 12:06:19
925	FUNDADISEN:93	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:06:22	2026-02-16 12:06:22
926	FUNDADISEN:60	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:06:27	2026-02-16 12:06:27
927	FUNDA_DISE_126	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:06:36	2026-02-16 12:06:36
928	FUNDADISENO:12	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:06:40	2026-02-16 12:06:40
929	FUNDADISENO:10	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:06:45	2026-02-16 12:06:45
930	FUNDADISENO:13	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:06:49	2026-02-16 12:06:49
931	FUNDA_DISE_151	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:06:53	2026-02-16 12:06:53
932	FUNDA_DISE_169	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:06:57	2026-02-16 12:06:57
933	FUNDA_DISE_170	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:07:01	2026-02-16 12:07:01
934	FUNDA_DISE_172	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:07:05	2026-02-16 12:07:05
935	FUNDA_DISE_173	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:07:08	2026-02-16 12:07:08
936	FUNDA_DISE_171	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:07:12	2026-02-16 12:07:12
937	FUNDADISEN:91	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:07:17	2026-02-16 12:07:17
938	FUNDADISEN:32	funda	Funda de Diseño IP 12 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:07:21	2026-02-16 12:07:21
939	FUNDA: 4	funda	Funda de Diseño IP 13/14	CHINA	35.00	70.00	disponible	2026-02-16 12:08:16	2026-02-16 12:08:29
940	FUNDADISENO:82	funda	Funda de Diseño IP 13/14	CHINA	35.00	70.00	disponible	2026-02-16 12:08:40	2026-02-16 12:08:40
941	FUNDA: 2	funda	Funda de Diseño IP 13/14	CHINA	35.00	70.00	disponible	2026-02-16 12:08:44	2026-02-16 12:08:44
942	FUNDADISEN:47	funda	Funda de Diseño IP 13/14	CHINA	35.00	70.00	disponible	2026-02-16 12:08:48	2026-02-16 12:08:48
943	FUNDA_DISE_234	funda	Funda de Diseño IP 13/14	CHINA	35.00	70.00	disponible	2026-02-16 12:08:52	2026-02-16 12:08:52
944	FUNDADISENO:78	funda	Funda de Diseño IP 13/14	CHINA	35.00	70.00	disponible	2026-02-16 12:09:03	2026-02-16 12:09:03
945	FUNDADISEN:49	funda	Funda de Diseño IP 13/14	CHINA	35.00	70.00	disponible	2026-02-16 12:09:07	2026-02-16 12:09:07
946	FUNDA_DISE_231	funda	Funda de Diseño IP 13/14	CHINA	35.00	70.00	disponible	2026-02-16 12:09:11	2026-02-16 12:09:11
947	FUNDA_DISE_232	funda	Funda de Diseño IP 13/14	CHINA	35.00	70.00	disponible	2026-02-16 12:09:14	2026-02-16 12:09:14
948	FUNDA_DISE_233	funda	Funda de Diseño IP 13/14	CHINA	35.00	70.00	disponible	2026-02-16 12:09:19	2026-02-16 12:09:19
949	FUNDADISEN:44	funda	Funda de Diseño IP 13/14	CHINA	35.00	70.00	disponible	2026-02-16 12:09:24	2026-02-16 12:09:24
950	FUNDA_DISE_120	funda	Funda de Diseño IP 13 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:10:00	2026-02-16 12:10:00
951	FUNDAS_DIS_1	funda	Funda de Diseño IP 13 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:10:34	2026-02-16 12:10:34
952	FUNDA_DISE_119	funda	Funda de Diseño IP 13 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:10:39	2026-02-16 12:10:39
953	FUNDADISEN:67	funda	Funda de Diseño IP 13 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:10:43	2026-02-16 12:10:43
954	FUNDAS_DIS_2	funda	Funda de Diseño IP 13 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:11:08	2026-02-16 12:11:08
955	FUNDADISEN:66	funda	Funda de Diseño IP 13 PRO	CHINA	15.00	30.00	disponible	2026-02-16 12:11:22	2026-02-16 12:11:22
956	FUNDADISEN:64	funda	Funda de Diseño IP 13 PRO	CHINA	15.00	30.00	disponible	2026-02-16 12:11:27	2026-02-16 12:11:27
957	FUNDA_AYE_8	funda	Funda de Diseño IP 13 PRO	AYELEN VARGAS	10.00	50.00	disponible	2026-02-16 12:12:32	2026-02-16 12:12:32
958	FUNDA_DISE_134	funda	Funda de Diseño IP 13 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:12:50	2026-02-16 12:12:50
1001	FUNDADISENO:8	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:20:19	2026-02-16 12:20:19
959	FUNDA_AYE_6	funda	Funda de Diseño IP 13 PRO	AYELEN VARGAS	5.00	70.00	disponible	2026-02-16 12:12:57	2026-02-16 12:13:19
960	FUNDADISEN:65	funda	Funda de Diseño IP 13 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:13:27	2026-02-16 12:13:27
961	FUNDADISENO:91	funda	Funda de Diseño IP 13 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:13:50	2026-02-16 12:13:50
962	FUNDADISENO:92	funda	Funda de Diseño IP 13 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:13:54	2026-02-16 12:13:54
963	FUNDADISENO:93	funda	Funda de Diseño IP 13 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:13:58	2026-02-16 12:13:58
964	FUNDADISENO:67	funda	Funda de Diseño IP 13 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:14:02	2026-02-16 12:14:02
965	FUNDA_DISE_177	funda	Funda de Diseño IP 13 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:14:06	2026-02-16 12:14:06
966	FUNDADISEN:133	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	30.00	disponible	2026-02-16 12:14:47	2026-02-16 12:15:01
967	FUNDADISEN:135	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	30.00	disponible	2026-02-16 12:15:38	2026-02-16 12:15:38
968	FUNDADISEN:132	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	30.00	disponible	2026-02-16 12:15:47	2026-02-16 12:15:47
969	FUNDADISEN:114	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	30.00	disponible	2026-02-16 12:15:54	2026-02-16 12:15:54
970	FUNDA_DISE_73	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	40.00	disponible	2026-02-16 12:16:19	2026-02-16 12:16:19
971	FUNDADISEN:97	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	40.00	disponible	2026-02-16 12:16:22	2026-02-16 12:16:22
972	FUNDADISEN:139	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	40.00	disponible	2026-02-16 12:16:26	2026-02-16 12:16:26
973	FUNDADISEN:141	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	40.00	disponible	2026-02-16 12:16:31	2026-02-16 12:16:31
974	FUNDADISEN:138	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	40.00	disponible	2026-02-16 12:16:34	2026-02-16 12:16:34
975	FUNDADISEN:142	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	40.00	disponible	2026-02-16 12:16:37	2026-02-16 12:16:37
976	FUNDADISEN:143	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	40.00	disponible	2026-02-16 12:16:40	2026-02-16 12:16:40
977	FUNDADISEN:145	funda	Funda de Diseño IP 13 PRO MAX	CHINA	15.00	40.00	disponible	2026-02-16 12:16:44	2026-02-16 12:16:44
978	FUNDADISEN:113	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:17:27	2026-02-16 12:17:27
979	FUNDADISENO:90	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:17:32	2026-02-16 12:17:32
980	FUNDADISENO:64	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:17:34	2026-02-16 12:17:34
981	FUNDA_DISE_133	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:17:37	2026-02-16 12:17:37
982	FUNDADISENO:50	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:17:39	2026-02-16 12:17:39
983	FUNDA_DISE_183	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:17:52	2026-02-16 12:17:52
984	FUNDA_DISE_210	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:17:57	2026-02-16 12:17:57
985	FUNDA_DISE_206	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:18:01	2026-02-16 12:18:01
986	FUNDA_DISE_208	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:18:05	2026-02-16 12:18:05
987	FUNDA_DISE_204	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:18:08	2026-02-16 12:18:08
988	FUNDADISEN:111	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:18:12	2026-02-16 12:18:12
989	FUNDA_DISE_205	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:18:15	2026-02-16 12:18:15
990	FUNDA_DISE_211	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:18:20	2026-02-16 12:18:20
992	FUNDADISEN:104	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:18:29	2026-02-16 12:18:29
993	FUNDA_DISE_121	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:19:29	2026-02-16 12:19:29
994	FUNDA_DISE_123	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:19:34	2026-02-16 12:19:34
995	FUNDA_DISE_118	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:19:37	2026-02-16 12:19:37
996	FUNDA_DISE_131	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:19:40	2026-02-16 12:19:40
997	FUNDADISENO:7	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:19:43	2026-02-16 12:19:43
998	FUNDA_DISE_130	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:19:47	2026-02-16 12:19:47
999	FUNDADISENO:23	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:19:50	2026-02-16 12:19:50
1000	FUNDA_DISE_122	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:19:54	2026-02-16 12:19:54
1002	FUNDA_DISE_129	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:20:23	2026-02-16 12:20:23
1003	FUNDA_DISE_128	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:20:27	2026-02-16 12:20:27
1004	FUNDADISENO:25	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:20:29	2026-02-16 12:20:29
1005	FUNDADISENO:5	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:20:57	2026-02-16 12:20:57
1006	FUNDA_DISE_235	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:21:06	2026-02-16 12:21:06
1007	FUNDAS_DIS_3	funda	Funda de Diseño IP 14/13	CHINA	30.00	70.00	disponible	2026-02-16 12:21:23	2026-02-16 12:21:23
1008	FUNDA_DISE_150	funda	Funda de Diseño IP 14 PLUS	CHINA	30.00	70.00	disponible	2026-02-16 12:22:25	2026-02-16 12:22:25
1009	FUNDADISENO:33	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:24:20	2026-02-16 12:24:20
1010	FUNDADISENO:31	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:24:24	2026-02-16 12:24:24
1011	FUNDADISENO:27	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:24:28	2026-02-16 12:24:28
1012	FUNDADISENO:28	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:24:33	2026-02-16 12:24:33
1013	FUNDA_DISE_112	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:24:37	2026-02-16 12:24:37
1014	FUNDADISENO:32	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:24:49	2026-02-16 12:24:49
1015	FUNDA_DISE_111	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:24:57	2026-02-16 12:24:57
1016	FUNDA_DISE_S:24	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:25:00	2026-02-16 12:25:00
1017	FUNDADISENO:36	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:25:04	2026-02-16 12:25:04
1018	FUNDADISENO:29	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:25:17	2026-02-16 12:25:17
1019	FUNDA_DISE_116	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:25:21	2026-02-16 12:25:21
1020	FUNDADISENO:34	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:25:24	2026-02-16 12:25:24
1021	FUNDA_DISE_115	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:25:28	2026-02-16 12:25:28
1022	FUNDADISENO:30	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:25:31	2026-02-16 12:25:31
1023	FUNDADISEN:118	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:25:36	2026-02-16 12:25:36
1024	FUNDADISEN:120	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:26:23	2026-02-16 12:26:23
1025	FUNDADISENO:26	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:26:29	2026-02-16 12:26:29
1026	FUNDADISEN:73	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:26:34	2026-02-16 12:26:34
1027	FUNDADISEN:75	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:26:37	2026-02-16 12:26:37
1028	FUNDADISEN:74	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:26:40	2026-02-16 12:26:40
1029	FUNDA_DISE_108	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:26:49	2026-02-16 12:26:49
1030	FUNDA_DISE_110	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:26:52	2026-02-16 12:26:52
1031	FUNDA_DISE_113	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:26:54	2026-02-16 12:26:54
1032	FUNDA_DISE_114	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:26:57	2026-02-16 12:26:57
1033	FUNDA_DISE_109	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:26:59	2026-02-16 12:26:59
1034	FUNDADISEN:115	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:27:02	2026-02-16 12:27:02
1035	FUNDA_DISE_178	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:27:15	2026-02-16 12:27:15
1036	FUNDA_DISE_203	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:27:20	2026-02-16 12:27:20
1037	FUNDA_DISE_199	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:27:23	2026-02-16 12:27:23
1038	FUNDA_DISE_138	funda	Funda de Diseño IP 14 PRO	CHINA	30.00	70.00	disponible	2026-02-16 12:27:27	2026-02-16 12:27:27
1039	FUNDA_DISE_99	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:28:31	2026-02-16 12:28:31
1040	FUNDA: 31	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:28:36	2026-02-16 12:28:36
1041	FUNDADISENO:51	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:28:41	2026-02-16 12:28:41
1042	FUNDADISEN:149	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:28:47	2026-02-16 12:28:47
1043	FUNDADISENO:38	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:28:52	2026-02-16 12:28:52
1044	FUNDA: 28	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:28:57	2026-02-16 12:28:57
1045	FUNDA_DISE_83	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:29:11	2026-02-16 12:29:11
1046	FUNDA_DISE_85	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:29:14	2026-02-16 12:29:14
1047	FUNDA_DISE_81	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:29:43	2026-02-16 12:29:43
1048	FUNDA_DISE_75	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:29:50	2026-02-16 12:29:50
1049	FUNDA: 112	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:29:54	2026-02-16 12:29:54
1050	FUNDA: 107	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:29:58	2026-02-16 12:29:58
1051	FUNDA_DISE_79	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:30:02	2026-02-16 12:30:02
1052	FUNDA_DISE_84	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:30:05	2026-02-16 12:30:05
1053	FUNDA_DISE_102	funda	Funda de Diseño IP 14 PRO MAX	CHINA	30.00	70.00	disponible	2026-02-16 12:30:09	2026-02-16 12:30:09
1054	FUNDADISENO:39	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:30:37	2026-02-16 12:30:37
1055	FUNDADISENO:3	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:30:44	2026-02-16 12:30:44
1056	FUNDA_DISE_66	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:30:50	2026-02-16 12:30:50
1057	FUNDA: 20	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:30:53	2026-02-16 12:30:53
1058	FUNDA_DISE_64	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:30:56	2026-02-16 12:30:56
1059	FUNDA_DISE_65	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:31:01	2026-02-16 12:31:01
1060	FUNDA: 27	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:31:04	2026-02-16 12:31:04
1061	FUNDA: 108	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:31:07	2026-02-16 12:31:07
1062	FUNDA_DISE_62	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:31:57	2026-02-16 12:31:57
1063	FUNDA_DISE_136	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:32:00	2026-02-16 12:32:00
1064	FUNDA_DISE_100	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:32:26	2026-02-16 12:32:26
1065	FUNDA_DISE_104	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:32:29	2026-02-16 12:32:29
1066	FUNDA: 12	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:32:32	2026-02-16 12:32:32
1067	FUNDA: 26	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:32:36	2026-02-16 12:32:36
1068	FUNDA_DISE_76	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:32:39	2026-02-16 12:32:39
1069	FUNDA: 105	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:32:43	2026-02-16 12:32:43
1070	FUNDA: 100	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:32:56	2026-02-16 12:32:56
1071	FUNDA_DISE_77	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:32:58	2026-02-16 12:32:58
1072	FUNDA: 101	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:33:10	2026-02-16 12:33:10
1073	FUNDA: 102	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:33:12	2026-02-16 12:33:12
1074	FUNDA: 111	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:33:15	2026-02-16 12:33:15
1075	FUNDA_DISE_86	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:33:19	2026-02-16 12:33:19
1076	FUNDADISENO:37	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:33:41	2026-02-16 12:33:41
1077	FUNDADISENO:1	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:33:48	2026-02-16 12:33:48
1078	FUNDADISENO:48	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:33:51	2026-02-16 12:33:51
1079	FUNDA_DISE_63	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:33:55	2026-02-16 12:33:55
1080	FUNDA_DISE_80	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:33:59	2026-02-16 12:33:59
1081	FUNDADISENO:45	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:34:04	2026-02-16 12:34:04
1082	FUNDA_DISE_87	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:34:07	2026-02-16 12:34:07
1083	FUNDADISENO:52	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:34:11	2026-02-16 12:34:11
1084	FUNDAS_DIS_4	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:34:44	2026-02-16 12:34:44
1085	FUNDADISENO:54	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:35:22	2026-02-16 12:35:22
1086	FUNDA_DISE_103	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:35:27	2026-02-16 12:35:27
1087	FUNDA_DISE_78	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:35:30	2026-02-16 12:35:30
1089	FUNDA: 33	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:35:38	2026-02-16 12:35:38
1090	FUNDA_DISE_101	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:35:40	2026-02-16 12:35:40
1091	FUNDA: 104	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:35:49	2026-02-16 12:35:49
1092	FUNDADISEN:150	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:35:53	2026-02-16 12:35:53
1093	FUNDA_DISE_82	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:35:56	2026-02-16 12:35:56
1094	FUNDA_DISE_93	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:35:59	2026-02-16 12:35:59
1095	FUNDADISENO:49	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:36:02	2026-02-16 12:36:02
1096	FUNDA_DISE_95	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:36:05	2026-02-16 12:36:05
1097	FUNDADISENO:53	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:36:08	2026-02-16 12:36:08
1098	FUNDADISENO:55	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:36:11	2026-02-16 12:36:11
1099	FUNDADISEN:148	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:36:14	2026-02-16 12:36:14
1100	FUNDADISENO:2	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:37:19	2026-02-16 12:37:19
1101	FUNDA_DISE_181	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:37:23	2026-02-16 12:37:23
1103	FUNDA_DISE_186	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:37:30	2026-02-16 12:37:30
1104	FUNDA_DISE_184	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:37:34	2026-02-16 12:37:34
1105	FUNDA_DISE_188	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:37:38	2026-02-16 12:37:38
1106	FUNDA_DISE_185	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:37:41	2026-02-16 12:37:41
1107	FUNDA_DISE_182	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:37:44	2026-02-16 12:37:44
1108	FUNDA_DISE_179	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:37:48	2026-02-16 12:37:48
1109	FUNDADISENO:109	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:38:47	2026-02-16 12:38:47
1110	FUNDADISENO:46	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:38:52	2026-02-16 12:38:52
1111	FUNDADISENO:110	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:38:57	2026-02-16 12:38:57
1112	FUNDADISENO:40	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:39:00	2026-02-16 12:39:00
1113	FUNDA: 95	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:39:04	2026-02-16 12:39:04
1114	FUNDA: 90	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:39:08	2026-02-16 12:39:08
1115	FUNDA: 91	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:39:12	2026-02-16 12:39:12
1116	FUNDA: 84	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:42:27	2026-02-16 12:42:27
1117	FUNDADISENO:73	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:43:46	2026-02-16 12:43:46
1118	FUNDADISENO:72	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:43:52	2026-02-16 12:43:52
1119	FUNDADISENO:56	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:43:55	2026-02-16 12:43:55
1120	FUNDADISENO:62	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:43:57	2026-02-16 12:43:57
1121	FUNDADISENO:66	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:44:12	2026-02-16 12:44:12
1122	FUNDADISENO:70	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:44:20	2026-02-16 12:44:20
1123	FUNDADISENO:71	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:44:28	2026-02-16 12:44:28
1124	FUNDADISENO:63	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:44:31	2026-02-16 12:44:31
1125	FUNDA: 88	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:44:34	2026-02-16 12:44:34
1126	FUNDA_DISE_161	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:44:37	2026-02-16 12:44:37
1127	FUNDA: 87	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:45:23	2026-02-16 12:45:23
1128	FUNDA: 93	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:45:26	2026-02-16 12:45:26
1129	FUNDA: 99	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:46:13	2026-02-16 12:46:13
1102	FUNDA_DISE_187	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	vendido	2026-02-16 12:37:26	2026-03-31 17:12:08
1130	FUNDADISENO:68	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:46:17	2026-02-16 12:46:17
1131	FUNDADISENO:61	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:46:20	2026-02-16 12:46:20
1132	FUNDA: 92	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:46:23	2026-02-16 12:46:23
1133	FUNDA_DISEN_12	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:46:27	2026-02-16 12:46:27
1134	FUNDA_DISE_117	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:46:29	2026-02-16 12:46:29
1135	FUNDADISENO:42	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:46:38	2026-02-16 12:46:38
1136	FUNDADISENO:111	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:46:41	2026-02-16 12:46:41
1137	FUNDA: 89	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:46:45	2026-02-16 12:46:45
1139	FUNDADISENO:41	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:47:06	2026-02-16 12:47:06
1140	FUNDA: 96	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:47:12	2026-02-16 12:47:12
1141	FUNDA: 94	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:47:14	2026-02-16 12:47:14
1142	FUNDA_DISE_163	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:47:25	2026-02-16 12:47:25
1143	FUNDA_DISE_156	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:47:31	2026-02-16 12:47:31
1144	FUNDA_DISE_157	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:47:33	2026-02-16 12:47:33
1145	FUNDA_DISE_155	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:47:40	2026-02-16 12:47:40
1146	FUNDA_DISE_158	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:47:44	2026-02-16 12:47:44
1148	FUNDA_DISE_140	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:47:51	2026-02-16 12:47:51
1149	FUNDA_DISE_160	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:47:54	2026-02-16 12:47:54
1150	FUNDA_DISE_162	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:47:58	2026-02-16 12:47:58
1151	FUNDA_AYE_5	funda	Funda de Diseño IP 15 PRO	AYELEN VARGAS	5.00	50.00	disponible	2026-02-16 12:48:19	2026-02-16 12:48:19
1152	FUNDA: 65	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:48:48	2026-02-16 12:48:48
1153	FUNDA_DISE_74	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:48:53	2026-02-16 12:48:53
1154	FUNDA_DIS_73	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:48:56	2026-02-16 12:48:56
1155	FUNDA: 83	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:48:59	2026-02-16 12:48:59
1156	FUNDA_DISE_223	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:49:03	2026-02-16 12:49:03
1157	FUNDA_DISE_196	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:49:07	2026-02-16 12:49:07
1158	FUNDA_DISE_218	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:49:10	2026-02-16 12:49:10
1159	FUNDA_DISE_197	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:49:13	2026-02-16 12:49:13
1160	FUNDADISENO:75	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:49:37	2026-02-16 12:49:37
1161	FUNDA_DISE_88	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:49:40	2026-02-16 12:49:40
1162	FUNDA_DISE_90	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:49:43	2026-02-16 12:49:43
1163	FUNDA_DISE_70	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:49:46	2026-02-16 12:49:46
1165	FUNDA: 82	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:49:52	2026-02-16 12:49:52
1166	FUNDA_DISE_59	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:49:56	2026-02-16 12:49:56
1167	FUNDA_DISE_195	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:50:10	2026-02-16 12:50:10
1168	FUNDA_DISE_201	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:50:13	2026-02-16 12:50:13
1169	FUNDA_DISE_166	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:50:16	2026-02-16 12:50:16
1170	FUNDA_DISE_168	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:50:18	2026-02-16 12:50:18
1171	FUNDA_DISE_224	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:50:21	2026-02-16 12:50:21
1172	FUNDA_DISE_194	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:50:24	2026-02-16 12:50:24
1173	FUNDAS_DIS_5	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:51:34	2026-02-16 12:51:34
1174	FUNDAS_DIS_6	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:51:41	2026-02-16 12:51:41
1175	FUNDAS_DIS_7	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:51:46	2026-02-16 12:51:46
1176	FUNDA_DISE_222	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:51:50	2026-02-16 12:51:50
1177	FUNDA_DISE_220	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:51:55	2026-02-16 12:51:55
1178	FUNDA_DISE_221	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:51:58	2026-02-16 12:51:58
1179	FUNDA_DISE_191	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:52:02	2026-02-16 12:52:02
1181	FUNDAS_DIS_9	funda	Funda de Diseño IP 13 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:54:15	2026-02-16 12:54:15
1182	FUNDAS_DIS_10	funda	Funda de Diseño IP 16	CHINA	35.00	70.00	disponible	2026-02-16 12:55:22	2026-02-16 12:55:22
1183	FUNDAS_DIS_11	funda	Funda de Diseño IP 16	CHINA	35.00	70.00	disponible	2026-02-16 12:55:25	2026-02-16 12:55:25
1184	FUNDAS_DIS_12	funda	Funda de Diseño IP 16	CHINA	35.00	70.00	disponible	2026-02-16 12:55:28	2026-02-16 12:55:28
1185	FUNDA_DISE_174	funda	Funda de Diseño IP 16	CHINA	35.00	70.00	disponible	2026-02-16 12:55:33	2026-02-16 12:55:33
1186	FUNDA_DISE_154	funda	Funda de Diseño IP 16 PLUS	CHINA	35.00	70.00	disponible	2026-02-16 12:55:56	2026-02-16 12:55:56
1187	FUNDA_DISE_152	funda	Funda de Diseño IP 16 PLUS	CHINA	35.00	70.00	disponible	2026-02-16 12:56:00	2026-02-16 12:56:00
1188	FUNDA_DISE_153	funda	Funda de Diseño IP 16 PLUS	CHINA	35.00	70.00	disponible	2026-02-16 12:56:03	2026-02-16 12:56:03
1189	FUNDA_DISE_237	funda	Funda de Diseño IP 16 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:56:33	2026-02-16 12:56:33
1190	FUNDA_DISE_239	funda	Funda de Diseño IP 16 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:56:37	2026-02-16 12:56:37
1191	FUNDA_DISE_236	funda	Funda de Diseño IP 16 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:56:42	2026-02-16 12:56:42
1147	FUNDA_DISE_159	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	70.00	vendido	2026-02-16 12:47:48	2026-03-09 20:00:24
1138	FUNDA_DISE_S:20	funda	Funda de Diseño IP 15 PRO	CHINA	35.00	100.00	vendido	2026-02-16 12:46:48	2026-03-09 19:43:49
1164	FUNDA_DISE_244	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	vendido	2026-02-16 12:49:49	2026-03-31 18:17:04
1192	FUNDA_DISE_238	funda	Funda de Diseño IP 16 PRO	CHINA	35.00	70.00	disponible	2026-02-16 12:56:45	2026-02-16 12:56:45
1193	FUNDA_DISE_145	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:57:02	2026-02-16 12:57:02
1194	FUNDA_DISE_226	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:57:04	2026-02-16 12:57:04
1195	FUNDA_DISE_229	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:57:07	2026-02-16 12:57:07
1196	FUNDA_DISE_227	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:57:10	2026-02-16 12:57:10
1197	FUNDA_DISE_228	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:57:13	2026-02-16 12:57:13
1198	FUNDA_DISE_146	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:57:17	2026-02-16 12:57:17
1199	FUNDAS_DIS_13	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 12:57:47	2026-02-16 12:57:57
1200	FUNDA_DISE_142	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:00:18	2026-02-16 13:00:18
1201	FUNDA_DISE_225	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:00:22	2026-02-16 13:00:22
1202	FUNDA_DISE_148	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:00:25	2026-02-16 13:00:25
1203	FUNDA_DISE_149	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:00:28	2026-02-16 13:00:28
1204	FUNDA_DISE_147	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:00:30	2026-02-16 13:00:30
1205	FUNDA_DISE_143	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:00:34	2026-02-16 13:00:34
1206	FUNDA_DISE_230	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:00:38	2026-02-16 13:00:38
1207	FUNDA_DISE_144	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:00:42	2026-02-16 13:00:42
1208	FUNDA_DISE_175	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:00:57	2026-02-16 13:00:57
1209	FUNDAS_DIS_16	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:01:00	2026-02-16 13:01:00
1210	FUNDAS_DIS_15	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:01:03	2026-02-16 13:01:03
1211	FUNDAS_DIS_17	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:01:06	2026-02-16 13:01:06
1212	FUNDAS_DIS_18	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:01:09	2026-02-16 13:01:09
1213	FUNDAS_DIS_19	funda	Funda de Diseño IP 16 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:01:12	2026-02-16 13:01:12
1214	FUNDAS_DIS_14	funda	Funda de Diseño IP 17 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 13:01:32	2026-02-16 13:01:32
1215	CARGADOR_PORTA:1	accesorio	POWER BANK	GZ STORES	120.00	400.00	disponible	2026-02-16 13:03:50	2026-02-16 13:03:50
1217	FUNDA_SILIC_161	funda	FUNDA DE SILICONA IP 6/6S	CHINA	20.00	60.00	disponible	2026-02-16 13:18:52	2026-02-16 13:18:52
1218	FUNDA_SILIC_160	funda	FUNDA DE SILICONA IP 6/6S	CHINA	20.00	60.00	disponible	2026-02-16 13:18:56	2026-02-16 13:18:56
1219	FUNDA_SILIC_159	funda	FUNDA DE SILICONA IP 6/6S	CHINA	20.00	60.00	disponible	2026-02-16 13:18:58	2026-02-16 13:18:58
1220	FUNDA_SILIC_158	funda	FUNDA DE SILICONA IP 6/6S	CHINA	20.00	60.00	disponible	2026-02-16 13:19:00	2026-02-16 13:19:00
1221	FUNDA_SILIC_163	funda	FUNDA DE SILICONA IP 6/6S PLUS	CHINA	20.00	60.00	disponible	2026-02-16 13:19:16	2026-02-16 13:19:16
1222	FUNDA_SILIC_162	funda	FUNDA DE SILICONA IP 6/6S PLUS	CHINA	20.00	60.00	disponible	2026-02-16 13:19:19	2026-02-16 13:19:19
1223	FUNDA_SILIC_154	funda	FUNDA DE SILICONA IP 7/8	CHINA	20.00	60.00	disponible	2026-02-16 13:19:37	2026-02-16 13:19:37
1224	FUNDA_SILIC_155	funda	FUNDA DE SILICONA IP 7/8	CHINA	20.00	60.00	disponible	2026-02-16 13:19:40	2026-02-16 13:19:40
1225	FUNDA_SILIC_156	funda	FUNDA DE SILICONA IP 7/8	CHINA	20.00	60.00	disponible	2026-02-16 13:19:43	2026-02-16 13:19:43
1226	FUNDA_SILIC_157	funda	FUNDA DE SILICONA IP 7/8	CHINA	20.00	60.00	disponible	2026-02-16 13:19:47	2026-02-16 13:19:47
1227	FUNDA_SILIC_167	funda	FUNDA DE SILICONA IP 7/8 PLUS	CHINA	20.00	60.00	disponible	2026-02-16 13:19:56	2026-02-16 13:19:56
1228	FUNDA_SILIC_166	funda	FUNDA DE SILICONA IP 7/8 PLUS	CHINA	20.00	60.00	disponible	2026-02-16 13:19:58	2026-02-16 13:19:58
1229	FUNDA_SILIC_165	funda	FUNDA DE SILICONA IP 7/8 PLUS	CHINA	20.00	60.00	disponible	2026-02-16 13:20:01	2026-02-16 13:20:01
1230	FUNDA_SILIC_164	funda	FUNDA DE SILICONA IP 7/8 PLUS	CHINA	20.00	60.00	disponible	2026-02-16 13:20:03	2026-02-16 13:20:03
1238	FUNDASILI:86	funda	FUNDA DE SILICONA IP X/XS	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:22:37	2026-02-16 13:22:37
1242	FUNDASILI:227	funda	FUNDA DE SILICONA IP XR	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:01	2026-02-16 13:23:01
1244	FUNDASILI:239	funda	FUNDA DE SILICONA IP XR	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:05	2026-02-16 13:23:05
1246	FUNDASILI:224	funda	FUNDA DE SILICONA IP XR	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:11	2026-02-16 13:23:11
1248	FUNDASILI:91	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:33	2026-02-16 13:23:33
1249	FUNDASILI:219	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:36	2026-02-16 13:23:36
1250	FUNDASILI:215	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:40	2026-02-16 13:23:40
1251	FUNDASILI:216	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:43	2026-02-16 13:23:43
1252	FUNDASILI:92	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:46	2026-02-16 13:23:46
1253	FUNDASILI:223	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:48	2026-02-16 13:23:48
1254	FUNDASILI:217	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:51	2026-02-16 13:23:51
1255	FUNDASILI:218	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:53	2026-02-16 13:23:53
1256	FUNDASILI:221	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:56	2026-02-16 13:23:56
1257	FUNDASILI:220	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:23:59	2026-02-16 13:23:59
1258	FUNDASILI:94	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:02	2026-02-16 13:24:02
1259	FUNDASILI:89	funda	FUNDA DE SILICONA IP XS MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:04	2026-02-16 13:24:04
1260	FUNDASILI:105	funda	FUNDA DE SILICONA IP 11 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:26	2026-02-16 13:24:26
1261	FUNDASILI:107	funda	FUNDA DE SILICONA IP 11 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:31	2026-02-16 13:24:31
1262	FUNDASILI:104	funda	FUNDA DE SILICONA IP 11 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:33	2026-02-16 13:24:33
1263	FUNDASILI:115	funda	FUNDA DE SILICONA IP 11 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:37	2026-02-16 13:24:37
1264	FUNDASILI:109	funda	FUNDA DE SILICONA IP 11 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:40	2026-02-16 13:24:40
1265	FUNDASILI:110	funda	FUNDA DE SILICONA IP 11 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:43	2026-02-16 13:24:43
1266	FUNDASILI:108	funda	FUNDA DE SILICONA IP 11 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:45	2026-02-16 13:24:45
1267	FUNDASILI:113	funda	FUNDA DE SILICONA IP 11 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:47	2026-02-16 13:24:47
1268	FUNDASILI:118	funda	FUNDA DE SILICONA IP 11 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:50	2026-02-16 13:24:50
1269	FUNDASILI:106	funda	FUNDA DE SILICONA IP 11 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:52	2026-02-16 13:24:52
1270	FUNDASILI:97	funda	FUNDA DE SILICONA IP 11 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:24:55	2026-02-16 13:24:55
1271	FUNDASILI:257	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:25:18	2026-02-16 13:25:18
1272	FUNDASILI:209	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:25:20	2026-02-16 13:25:20
1273	FUNDASILI:208	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:25:23	2026-02-16 13:25:23
1274	FUNDASILI:212	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:25:26	2026-02-16 13:25:26
1275	FUNDASILI:260	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:25:28	2026-02-16 13:25:28
1276	FUNDASILI:214	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:25:32	2026-02-16 13:25:32
1277	FUNDASILI:207	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:25:34	2026-02-16 13:25:34
1278	FUNDASILI:202	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:25:37	2026-02-16 13:25:37
1279	FUNDASILI:204	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:25:40	2026-02-16 13:25:40
1280	FUNDASILI:213	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:25:43	2026-02-16 13:25:43
1281	FUNDASILI:200	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:25:46	2026-02-16 13:25:46
1282	FUNDASILI:45	funda	FUNDA DE SILICONA IP 12 MINI	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:26:07	2026-02-16 13:26:07
1283	FUNDASILI:47	funda	FUNDA DE SILICONA IP 12 MINI	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:26:10	2026-02-16 13:26:10
1284	FUNDA_SIL_404	funda	FUNDA DE SILICONA IP 12 MINI	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:26:12	2026-02-16 13:26:12
1285	FUNDASILI:138	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:26:55	2026-02-16 13:26:55
1286	FUNDASILI:126	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:26:58	2026-02-16 13:26:58
1287	FUNDASILI:130	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:27:00	2026-02-16 13:27:00
1288	FUNDASILI:124	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:27:04	2026-02-16 13:27:04
1289	FUNDASILI:122	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:27:10	2026-02-16 13:27:10
1290	FUNDASILI:131	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:27:13	2026-02-16 13:27:13
1291	FUNDASILI:48	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:27:16	2026-02-16 13:27:16
1292	FUNDASILI:128	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:27:19	2026-02-16 13:27:19
1293	FUNDASILI:129	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:27:21	2026-02-16 13:27:21
1294	FUNDASILI:135	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:27:23	2026-02-16 13:27:23
1295	FUNDASILI:134	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:28:31	2026-02-16 13:28:31
1296	FUNDASILI:137	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:28:34	2026-02-16 13:28:34
1297	FUNDASILI:119	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:28:37	2026-02-16 13:28:37
1298	FUNDASILI:40	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:28:39	2026-02-16 13:28:39
1299	FUNDASILI:125	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:28:42	2026-02-16 13:28:42
1300	FUNDASILI:139	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:29:42	2026-02-16 13:29:42
1301	FUNDASILI:123	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:29:47	2026-02-16 13:29:47
1302	FUNDASILI:49	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:31:09	2026-02-16 13:31:09
1303	FUNDASILI:51	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:31:13	2026-02-16 13:31:13
1304	FUNDASILI:133	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:31:17	2026-02-16 13:31:17
1305	FUNDASILI:52	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:31:22	2026-02-16 13:31:22
1306	FUNDASILI:44	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:31:27	2026-02-16 13:31:27
1307	FUNDASILI:43	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:31:33	2026-02-16 13:31:33
1308	FUNDASILI:136	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:31:37	2026-02-16 13:31:37
1309	FUNDASILI:120	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:31:41	2026-02-16 13:31:41
1310	FUNDASILI:121	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:31:46	2026-02-16 13:31:46
1311	FUNDASILI:54	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:31:49	2026-02-16 13:31:49
1312	FUNDASILI:50	funda	FUNDA DE SILICONA IP 12/12 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:31:53	2026-02-16 13:31:53
1313	FUNDASILI:275	funda	FUNDA DE SILICONA IP 12 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:32:26	2026-02-16 13:32:26
1314	FUNDASILI:271	funda	FUNDA DE SILICONA IP 12 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:32:31	2026-02-16 13:32:31
1315	FUNDASILI:270	funda	FUNDA DE SILICONA IP 12 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:32:35	2026-02-16 13:32:35
1316	FUNDASILI:269	funda	FUNDA DE SILICONA IP 12 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:32:39	2026-02-16 13:32:39
1317	FUNDASILI:273	funda	FUNDA DE SILICONA IP 12 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:32:42	2026-02-16 13:32:42
1318	FUNDASILI:58	funda	FUNDA DE SILICONA IP 13	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:32:59	2026-02-16 13:32:59
1319	FUNDASILI:148	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:00	2026-02-16 13:34:00
1320	FUNDASILI:147	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:04	2026-02-16 13:34:04
1321	FUNDASILI:145	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:09	2026-02-16 13:34:09
1322	FUNDASILI:153	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:13	2026-02-16 13:34:13
1323	FUNDASILI:154	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:17	2026-02-16 13:34:17
1324	FUNDASILI:155	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:23	2026-02-16 13:34:23
1325	FUNDASILI:144	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:28	2026-02-16 13:34:28
1326	FUNDASILI:150	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:32	2026-02-16 13:34:32
1327	FUNDASILI:142	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:36	2026-02-16 13:34:36
1328	FUNDASILI:149	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:41	2026-02-16 13:34:41
1329	FUNDASILI:152	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:47	2026-02-16 13:34:47
1330	FUNDASILI:146	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:52	2026-02-16 13:34:52
1331	FUNDASILI:157	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:34:58	2026-02-16 13:34:58
1332	FUNDASILI:158	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:35:02	2026-02-16 13:35:02
1333	FUNDASILI:140	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:35:07	2026-02-16 13:35:07
1334	FUNDASILI:141	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:35:11	2026-02-16 13:35:11
1335	FUNDASILI:151	funda	FUNDA DE SILICONA IP 13 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:35:16	2026-02-16 13:35:16
1336	FUNDASILI:178	funda	FUNDA DE SILICONA IP 13 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:35:51	2026-02-16 13:35:51
1337	FUNDASILI:182	funda	FUNDA DE SILICONA IP 13 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:35:56	2026-02-16 13:35:56
1338	FUNDASILI:180	funda	FUNDA DE SILICONA IP 13 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:36:09	2026-02-16 13:36:09
1339	FUNDAS_DIS_175	funda	FUNDA DE SILICONA IP 13 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:36:18	2026-02-16 13:36:18
1340	FUNDAS_DIS_176	funda	FUNDA DE SILICONA IP 13 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:36:24	2026-02-16 13:36:24
1341	FUNDASILI:179	funda	FUNDA DE SILICONA IP 13 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:36:28	2026-02-16 13:36:28
1342	FUNDASILI:186	funda	FUNDA DE SILICONA IP 13 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:36:32	2026-02-16 13:36:32
1343	FUNDASILI:185	funda	FUNDA DE SILICONA IP 13 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 13:36:38	2026-02-16 13:36:38
1344	FUNDASILI:199	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:50:42	2026-02-16 14:50:42
1345	FUNDASILI:261	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:50:53	2026-02-16 14:50:53
1346	FUNDASILI:259	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:50:58	2026-02-16 14:50:58
1347	FUNDASILI:258	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:51:04	2026-02-16 14:51:04
1348	FUNDASILI:210	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:51:07	2026-02-16 14:51:07
1349	FUNDASILI:206	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:51:12	2026-02-16 14:51:12
1350	FUNDASILI:203	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:51:17	2026-02-16 14:51:17
1351	FUNDASILI:256	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:51:22	2026-02-16 14:51:22
1352	FUNDASILI:201	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:51:32	2026-02-16 14:51:32
1353	FUNDASILI:211	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:51:37	2026-02-16 14:51:37
1354	FUNDASILI:255	funda	FUNDA DE SILICONA IP 11 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:51:42	2026-02-16 14:51:42
1355	FUNDASILI:173	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:52:15	2026-02-16 14:52:15
1356	FUNDASILI:170	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:52:18	2026-02-16 14:52:18
1357	FUNDASILI:290	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:52:22	2026-02-16 14:52:22
1358	FUNDASILI:285	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:52:24	2026-02-16 14:52:24
1359	FUNDASILI:171	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:52:26	2026-02-16 14:52:26
1360	FUNDASILI:289	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:52:29	2026-02-16 14:52:29
1361	FUNDASILI:281	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:52:33	2026-02-16 14:52:33
1362	FUNDASILI:287	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:52:53	2026-02-16 14:52:53
1363	FUNDASILI:282	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:52:56	2026-02-16 14:52:56
1364	FUNDASILI:284	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:52:59	2026-02-16 14:52:59
1365	FUNDASILI:175	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:53:04	2026-02-16 14:53:04
1366	FUNDASILI:286	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:53:07	2026-02-16 14:53:07
1367	FUNDASILI:288	funda	FUNDA DE SILICONA IP 14 PRO	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:53:12	2026-02-16 14:53:12
1368	FUNDASILI:166	funda	FUNDA DE SILICONA IP 14 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:53:34	2026-02-16 14:53:34
1369	FUNDASILI:165	funda	FUNDA DE SILICONA IP 14 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:53:37	2026-02-16 14:53:37
1370	FUNDASILI:283	funda	FUNDA DE SILICONA IP 14 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:53:39	2026-02-16 14:53:39
1371	FUNDASILI:168	funda	FUNDA DE SILICONA IP 14 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:53:41	2026-02-16 14:53:41
1372	FUNDASILI:77	funda	FUNDA DE SILICONA IP 14 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:53:43	2026-02-16 14:53:43
1373	FUNDASILI:167	funda	FUNDA DE SILICONA IP 14 PRO MAX	CARLOS EEUU	26.00	60.00	disponible	2026-02-16 14:53:50	2026-02-16 14:53:50
1374	FUNDA_DISE_242	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:28:02	2026-02-16 15:28:02
1375	FUNDA_DIS_74	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:28:14	2026-02-16 15:28:14
1376	FUNDA: 113	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:28:19	2026-02-16 15:28:19
1377	FUNDA: 114	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:28:25	2026-02-16 15:28:25
1378	FUNDA: 79	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:28:34	2026-02-16 15:28:34
1379	FUNDA_DISE_60	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:28:40	2026-02-16 15:28:40
1380	FUNDA_DISE_71	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:28:43	2026-02-16 15:28:43
1381	FUNDA_DISE_67	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:28:48	2026-02-16 15:28:48
1382	FUNDA_DISE_61	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:29:07	2026-02-16 15:29:07
1383	FUNDA_DISE_89	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:29:15	2026-02-16 15:29:15
1384	FUNDADISENO:87	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:29:26	2026-02-16 15:29:26
1385	FUNDA: 80	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:29:31	2026-02-16 15:29:31
1386	FUNDADISENO:88	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:29:41	2026-02-16 15:29:41
1387	FUNDADISENO:80	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:30:15	2026-02-16 15:30:15
1388	FUNDADISENO:85	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:30:19	2026-02-16 15:30:19
1389	FUNDA_DISE_107	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:30:36	2026-02-16 15:30:36
1390	FUNDA_DISE_164	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:30:41	2026-02-16 15:30:41
1391	FUNDA_DISE_193	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:30:45	2026-02-16 15:30:45
1392	FUNDA_DISE_189	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:30:50	2026-02-16 15:30:50
1393	FUNDA_DISE_165	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:30:56	2026-02-16 15:30:56
1394	FUNDA_DISE_215	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:31:00	2026-02-16 15:31:00
1395	FUNDA_DISE_216	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:31:03	2026-02-16 15:31:03
1396	FUNDA_DISE_217	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:31:06	2026-02-16 15:31:06
1397	FUNDA_DISE_167	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:31:11	2026-02-16 15:31:11
1398	FUNDA_DISE_202	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:31:14	2026-02-16 15:31:14
1399	FUNDA_DISE_139	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:31:18	2026-02-16 15:31:18
1400	FUNDA_DISE_192	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:31:22	2026-02-16 15:31:22
1401	FUNDA_DISE_198	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:31:25	2026-02-16 15:31:25
1402	FUNDA_DISE_219	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	disponible	2026-02-16 15:31:30	2026-02-16 15:31:30
1403	FUNDADISEN:121	funda	funda ip 14 pro	gz stores	20.00	60.00	vendido	2026-02-18 22:30:43	2026-02-18 22:31:57
271	Camara:51	vidrio_camara	VIDRIO CAMARA 14 PRO MAX	GZ STORES	20.00	40.00	vendido	2026-01-31 18:51:22	2026-02-18 22:31:57
332	ACCESORIO_25	accesorio	PROTECTOR CUBO 20W + PROTECTOR CABLE	GZ STORES	22.00	60.00	vendido	2026-02-04 14:37:19	2026-02-18 22:31:57
194	VIDRIOTEMSA:167	vidrio_templado	Vidrio Templado IP 17	GZ STORES	11.00	40.00	vendido	2026-01-31 13:35:36	2026-02-18 22:45:21
1404	FUNDAS_DIS_22	funda	Funda de Diseño IP 15 PRO MAX	EEUU	40.00	70.00	disponible	2026-02-19 12:51:28	2026-02-19 12:51:28
1405	FUNDAS_DIS_21	funda	Funda de Diseño IP 15 PRO MAX	EEUU	40.00	70.00	disponible	2026-02-19 12:51:35	2026-02-19 12:51:35
1406	FUNDAS_DIS_20	funda	Funda de Diseño IP 15 PRO MAX	EEUU	40.00	70.00	disponible	2026-02-19 12:51:42	2026-02-19 12:51:42
1407	FUNDAS_DIS_27	funda	Funda de Diseño IP 15 PRO MAX	EEUU	40.00	100.00	disponible	2026-02-19 12:51:53	2026-02-19 12:51:53
1408	FUNDAS_DIS_26	funda	Funda de Diseño IP 15 PRO MAX	EEUU	40.00	100.00	disponible	2026-02-19 12:52:05	2026-02-19 12:52:05
1409	FUNDAS_DIS_28	funda	Funda de Diseño IP 16 PRO MAX	EEUU	40.00	100.00	disponible	2026-02-19 12:53:11	2026-02-19 12:53:11
1410	FUNDAS_DIS_24	funda	Funda de Diseño IP 16 PRO MAX	EEUU	40.00	70.00	disponible	2026-02-19 12:53:18	2026-02-19 12:53:18
1411	FUNDAS_DIS_23	funda	Funda de Diseño IP 16 PRO MAX	EEUU	40.00	70.00	disponible	2026-02-19 12:53:24	2026-02-19 12:53:24
1412	FUNDAS_DIS_25	funda	Funda de Diseño IP 16 PRO MAX	EEUU	40.00	70.00	disponible	2026-02-19 12:53:29	2026-02-19 12:53:29
1413	SQUISHY: 1	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:52:28	2026-02-19 14:52:28
1414	SQUISHY: 2	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:52:45	2026-02-19 14:52:45
1415	SQUISHY: 3	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:57:01	2026-02-19 14:57:01
1416	SQUISHY: 4	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:57:07	2026-02-19 14:57:07
1417	SQUISHY: 5	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:57:12	2026-02-19 14:57:12
1418	SQUISHY: 6	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:57:16	2026-02-19 14:57:16
1419	SQUISHY: 7	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:57:20	2026-02-19 14:57:20
1420	SQUISHY: 8	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:57:25	2026-02-19 14:57:25
1421	SQUISHY: 9	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:57:30	2026-02-19 14:57:30
1422	SQUISHY: 10	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:57:35	2026-02-19 14:57:35
1423	SQUISHY: 11	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:58:12	2026-02-19 14:58:12
1424	SQUISHY: 12	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:58:31	2026-02-19 14:58:31
1425	SQUISHY: 13	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:58:37	2026-02-19 14:58:37
1426	SQUISHY: 14	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:58:45	2026-02-19 14:58:45
1427	SQUISHY: 15	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:58:50	2026-02-19 14:58:50
1428	SQUISHY: 16	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:58:54	2026-02-19 14:58:54
1429	SQUISHY: 17	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:58:59	2026-02-19 14:58:59
1430	SQUISHY: 18	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:59:03	2026-02-19 14:59:03
1431	SQUISHY: 19	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:59:06	2026-02-19 14:59:06
1432	SQUISHY: 20	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:59:09	2026-02-19 14:59:09
1433	SQUISHY: 21	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:59:12	2026-02-19 14:59:12
1434	SQUISHY: 22	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:59:15	2026-02-19 14:59:15
1435	SQUISHY: 23	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:59:19	2026-02-19 14:59:19
1436	SQUISHY: 24	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:59:23	2026-02-19 14:59:23
1437	SQUISHY: 25	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:59:28	2026-02-19 14:59:28
1438	SQUISHY: 26	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:59:32	2026-02-19 14:59:32
1439	SQUISHY: 27	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 14:59:36	2026-02-19 14:59:36
1440	SQUISHY: 28	otro	PARLANTE SQUISHY RGB	CARLOS EEUU	100.00	100.00	disponible	2026-02-19 15:02:32	2026-02-19 15:02:32
1441	VIDRIOSMP: 4	vidrio_templado	VIDRIO MACBOOK	GZ STORES	40.00	100.00	disponible	2026-02-19 15:18:34	2026-02-19 15:18:34
1442	VIDRIOSMP: 3	vidrio_templado	VIDRIO MACBOOK	GZ STORES	40.00	100.00	disponible	2026-02-19 15:18:42	2026-02-19 15:18:42
1443	VIDRIOSMP: 2	vidrio_templado	VIDRIO MACBOOK	GZ STORES	40.00	100.00	disponible	2026-02-19 15:18:48	2026-02-19 15:18:48
1444	VIDRIOSMP: 1	vidrio_templado	VIDRIO MACBOOK	GZ STORES	40.00	100.00	disponible	2026-02-19 15:18:53	2026-02-19 15:18:53
1445	VIDRIOSMP: 5	vidrio_templado	VIDRIO IPAD	GZ STORES	40.00	100.00	disponible	2026-02-19 15:19:14	2026-02-19 15:19:14
439	GR72J205403601DS	accesorio	Alexa Echo Spot	CARLOS EEUU	550.00	740.00	vendido	2026-02-04 19:20:12	2026-02-20 13:00:03
143	VIDRIOTEMSA:108	vidrio_templado	Vidrio Templado IP 15 PRO	GZ STORES	11.00	40.00	vendido	2026-01-31 13:09:56	2026-02-20 13:04:57
1180	FUNDAS_DIS_8	funda	Funda de Diseño IP 15	CHINA	35.00	70.00	vendido	2026-02-16 12:53:13	2026-02-20 13:04:57
406	CABLELIGHT: 5	cargador_20w	Cable USB C - to Lightning 1m	Santi Store	45.00	130.00	vendido	2026-02-04 18:29:38	2026-02-20 20:15:38
395	CUBO20W: 7	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	45.00	190.00	vendido	2026-02-04 18:20:21	2026-02-20 20:15:38
1088	FUNDADISENO:44	funda	Funda de Diseño IP 14 PRO MAX	CHINA	35.00	70.00	vendido	2026-02-16 12:35:35	2026-02-20 20:17:07
588	FUNDAM_SAFE: 19	funda	FUNDA MAGSAFE IP 16 PRO MAX	GZ STORES	40.00	100.00	vendido	2026-02-11 19:31:31	2026-02-20 20:17:07
991	FUNDA_DISE_209	funda	Funda de Diseño IP 13 PRO MAX	CHINA	30.00	70.00	vendido	2026-02-16 12:18:25	2026-02-20 20:17:07
105	VIDRIOTEMSA:52	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 12:41:11	2026-02-20 20:17:07
795	FUNDA_SILIC_73	funda	FUNDA SILICONA IP 15 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-14 21:12:41	2026-02-23 10:15:53
1447	FUNDA_AYE_9	funda	FUNDA IPAD	AYELEN VARGAS	10.00	150.00	disponible	2026-02-23 10:23:37	2026-02-23 10:23:37
1448	IPAD_CASE_1	funda	FUNDA IPAD PRO + TECLADO	GZ STORES	150.00	300.00	disponible	2026-02-23 10:40:30	2026-02-23 10:40:30
432	CABLEUSB: 3	cargador_5w	Cable Lightning to USB	GZ STORES	35.00	100.00	vendido	2026-02-04 19:03:58	2026-02-23 19:35:51
706	FUNDA_SILIC_30	funda	FUNDA SILICONA IP 13 PRO	GZ STORES	20.00	60.00	vendido	2026-02-14 20:56:49	2026-02-24 19:58:48
859	FUNDA_SILIC_129	funda	FUNDA SILICONA IP 17 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-14 21:25:18	2026-03-09 09:36:29
675	FUNDA_SILIC_13	funda	FUNDA SILICONA IP 12 PRO	GZ STORES	20.00	60.00	vendido	2026-02-14 20:50:18	2026-03-09 09:37:27
749	FUNDA_SILM_56	funda	FUNDA SILICONA IP 14 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-14 21:05:40	2026-03-09 09:38:07
1449	PLAY_STATION5	otro	PLAY STATION 5 CHOST OF YOTEI	CARLOS EEUU	5698.00	6500.00	vendido	2026-03-09 10:04:54	2026-03-09 10:05:51
1450	CUBO20W: 13	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	vendido	2026-03-10 09:53:26	2026-03-17 09:51:58
1458	CUBO20W: 21	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	200.00	vendido	2026-03-10 09:54:10	2026-03-10 19:08:52
506	FUNDAM_SAFE: 1	funda	FUNDA MAGSAFE IP 15	GZ STORES	40.00	100.00	vendido	2026-02-11 17:49:20	2026-03-09 19:26:09
863	FUNDA_SILIC_133	funda	FUNDA SILICONA IP 17 PRO MAX	GZ STORES	20.00	60.00	vendido	2026-02-14 21:25:27	2026-03-09 19:39:18
20	Vidrio:59	vidrio_templado	Vidrio Templado IP 12/13 Mini	CARLOS EEUU	11.00	40.00	vendido	2026-01-31 11:12:30	2026-03-09 19:41:34
1460	CUBO20W: 24	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	vendido	2026-03-10 09:54:37	2026-03-20 13:11:11
1446	FUNDA_MAG_S:52	funda	FUNDA MAGSAFE IP 17 PRO MAX	GZ STORES	40.00	150.00	vendido	2026-02-23 10:21:46	2026-03-09 19:51:40
426	CABLECAC: 1	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	54.00	190.00	vendido	2026-02-04 18:53:38	2026-03-09 19:59:18
633	FUNDA_SILIC_10	funda	FUNDA SILICONA IP 11	GZ STORES	20.00	60.00	vendido	2026-02-14 20:28:44	2026-03-09 20:02:11
181	VIDRIOTEMSA:147	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 13:25:01	2026-03-10 09:23:57
1453	CUBO20W: 16	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	disponible	2026-03-10 09:53:39	2026-03-10 09:53:39
1454	CUBO20W: 17	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	disponible	2026-03-10 09:53:46	2026-03-10 09:53:46
1455	CUBO20W: 18	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	disponible	2026-03-10 09:53:54	2026-03-10 09:53:54
1456	CUBO20W: 19	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	disponible	2026-03-10 09:54:00	2026-03-10 09:54:00
1457	CUBO20W: 20	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	disponible	2026-03-10 09:54:05	2026-03-10 09:54:05
1459	CUBO20W: 22	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	disponible	2026-03-10 09:54:32	2026-03-10 09:54:32
1461	CUBO20W: 25	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	disponible	2026-03-10 09:54:42	2026-03-10 09:54:42
1462	CUBO20W: 26	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	disponible	2026-03-10 09:54:48	2026-03-10 09:54:48
1463	CUBO20W: 27	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	disponible	2026-03-10 09:54:55	2026-03-10 09:54:55
1464	CABLELIGHT: 14	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 09:59:17	2026-03-10 09:59:17
1465	CABLELIGHT: 15	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 09:59:22	2026-03-10 09:59:22
1466	CABLELIGHT: 16	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 09:59:27	2026-03-10 09:59:27
1467	CABLELIGHT: 17	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 09:59:31	2026-03-10 09:59:31
1468	CABLELIGHT: 18	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 09:59:36	2026-03-10 09:59:36
1469	CABLELIGHT: 19	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 09:59:41	2026-03-10 09:59:41
1470	CABLELIGHT: 20	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 09:59:45	2026-03-10 09:59:45
1471	CABLELIGHT: 21	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 09:59:50	2026-03-10 09:59:50
1472	CABLELIGHT: 22	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 09:59:54	2026-03-10 09:59:54
1451	CUBO20W: 14	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	230.00	vendido	2026-03-10 09:53:32	2026-03-17 19:09:31
1452	CUBO20W: 15	cargador_20w	CUBO 20W Calidad Origen	SANTI STORES	60.00	190.00	vendido	2026-03-10 09:53:35	2026-03-17 19:13:17
1473	CABLELIGHT: 23	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 10:00:03	2026-03-10 10:00:03
1474	CABLELIGHT: 24	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 10:00:08	2026-03-10 10:00:08
1475	CABLELIGHT: 25	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 10:00:14	2026-03-10 10:00:14
1476	CABLELIGHT: 26	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	disponible	2026-03-10 10:00:20	2026-03-10 10:00:20
1479	CABLECAC: 7	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:47:45	2026-03-10 11:47:45
1480	CABLECAC: 8	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:47:53	2026-03-10 11:47:53
1481	CABLECAC: 9	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:47:59	2026-03-10 11:47:59
1482	CABLECAC: 10	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:48:05	2026-03-10 11:48:05
1483	CABLECAC: 11	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:48:16	2026-03-10 11:48:16
1484	CABLECAC: 12	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:48:30	2026-03-10 11:48:30
1485	CABLECAC: 13	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:48:35	2026-03-10 11:48:35
1489	CABLECAC: 17	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:49:09	2026-03-10 11:49:09
1490	CABLECAC: 18	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:49:18	2026-03-10 11:49:18
1491	CABLECAC: 19	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:49:23	2026-03-10 11:49:23
1492	CABLECAC: 20	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:49:31	2026-03-10 11:49:31
1493	CABLECAC: 21	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	disponible	2026-03-10 11:49:37	2026-03-10 11:49:37
1494	FUNDAS_DIS_177	funda	FUNDA DE SILICONA IP 17	GZ STORES	20.00	60.00	disponible	2026-03-13 09:31:28	2026-03-13 09:31:28
1495	FUNDAS_DIS_178	funda	FUNDA DE SILICONA IP 17	GZ STORES	20.00	60.00	disponible	2026-03-13 09:31:34	2026-03-13 09:31:34
1496	FUNDAS_DIS_179	funda	FUNDA DE SILICONA IP 17	GZ STORES	20.00	60.00	disponible	2026-03-13 09:31:38	2026-03-13 09:31:38
1499	VIDRIOTEMSA:213	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:49:39	2026-03-13 09:49:39
1500	VIDRIOTEMSA:212	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:49:43	2026-03-13 09:49:43
1501	VIDRIOTEMSA:211	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:49:48	2026-03-13 09:49:48
1502	VIDRIOTEMSA:210	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:49:52	2026-03-13 09:49:52
1503	VIDRIOTEMSA:209	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:04	2026-03-13 09:50:04
1504	VIDRIOTEMSA:208	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:08	2026-03-13 09:50:08
1505	VIDRIOTEMSA:207	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:13	2026-03-13 09:50:13
1506	VIDRIOTEMSA:206	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:18	2026-03-13 09:50:18
1507	VIDRIOTEMSA:205	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:22	2026-03-13 09:50:22
1508	VIDRIOTEMSA:204	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:27	2026-03-13 09:50:27
1509	VIDRIOTEMSA:203	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:31	2026-03-13 09:50:31
1510	VIDRIOTEMSA:202	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:36	2026-03-13 09:50:36
1511	VIDRIOTEMSA:201	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:41	2026-03-13 09:50:41
1512	VIDRIOTEMSA:200	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:47	2026-03-13 09:50:47
1513	VIDRIOTEMSA:199	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:51	2026-03-13 09:50:51
1514	VIDRIOTEMSA:198	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:50:55	2026-03-13 09:50:55
1515	VIDRIOTEMSA:197	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:51:00	2026-03-13 09:51:00
1516	VIDRIOTEMSA:196	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:51:05	2026-03-13 09:51:05
1517	VIDRIOTEMSA:195	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:51:11	2026-03-13 09:51:11
1518	VIDRIOTEMSA:194	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:51:15	2026-03-13 09:51:15
1519	VIDRIOTEMSA:193	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:51:31	2026-03-13 09:51:31
1520	VIDRIOTEMSA:192	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:51:59	2026-03-13 09:51:59
1522	VIDRIOTEMSA:190	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	disponible	2026-03-13 09:52:10	2026-03-13 09:52:10
1524	CARGADORAU: 2	cargador_20w	CARGADOR AUTO	GZ STORES	35.00	170.00	disponible	2026-03-13 10:01:11	2026-03-13 10:01:11
1525	MANDO_PLAY: 1	otro	MANDO PLAY 5 VERDE	CARLOS EEUU	650.00	780.00	vendido	2026-03-13 19:19:43	2026-03-13 19:20:06
1498	VIDRIOTEMSA:214	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	vendido	2026-03-13 09:49:34	2026-03-13 19:20:55
1523	CARGADORAU: 1	cargador_20w	CARGADOR AUTO	GZ STORES	35.00	170.00	vendido	2026-03-13 10:01:06	2026-03-16 19:44:44
1526	ECHO_DOT: 1	otro	ECHO DOT 5TA GEN.	CARLOS EEUU	493.00	540.00	vendido	2026-03-16 19:45:50	2026-03-16 19:46:33
1527	CARDADOR_GRAVASTAR: 1	cargador_20w	Gravastar 65 W Alpha	CARLOS EEUU	551.00	535.00	vendido	2026-03-17 19:08:58	2026-03-17 19:10:10
1497	FUNDAS_DIS_180	funda	FUNDA DE SILICONA IP 17	GZ STORES	20.00	60.00	vendido	2026-03-13 09:31:42	2026-03-17 19:11:08
1528	ECHO_DOT: 2	otro	ECHO DOT 5TA GEN.	CARLOS EEUU	493.00	540.00	vendido	2026-03-17 19:14:52	2026-03-17 19:15:29
1478	CABLELIGHT: 28	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	vendido	2026-03-10 10:00:33	2026-03-23 09:35:51
1488	CABLECAC: 16	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	vendido	2026-03-10 11:49:00	2026-03-27 10:34:09
1521	VIDRIOTEMSA:191	vidrio_templado	Vidrio Templado IP 16 PRO MAX	GZ STORES	4.95	40.00	vendido	2026-03-13 09:52:04	2026-03-31 17:16:03
1487	CABLECAC: 15	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	vendido	2026-03-10 11:48:54	2026-03-31 17:16:03
1486	CABLECAC: 14	cargador_20w	USB C - 60W Charge Cable 2 m	SANTI STORE	50.00	200.00	vendido	2026-03-10 11:48:42	2026-03-31 18:17:04
1477	CABLELIGHT: 27	cargador_20w	Cable USB C - to Lightning 1m	SANTI STORE	30.00	130.00	vendido	2026-03-10 10:00:26	2026-03-23 09:43:09
1529	CUBO20W: 23	cargador_20w	CUBO 20W Calidad Origen	SANTI STORE	60.00	190.00	vendido	2026-03-23 09:40:14	2026-03-23 09:43:09
1572	CABLECAC: 31	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	39.60	180.00	disponible	2026-04-02 10:00:31	2026-04-02 10:00:31
1573	CABLECAC: 30	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	39.60	180.00	disponible	2026-04-02 10:00:35	2026-04-02 10:00:35
1574	CABLECAC: 29	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	39.60	180.00	disponible	2026-04-02 10:00:40	2026-04-02 10:00:40
1575	CABLECAC: 28	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	39.60	180.00	disponible	2026-04-02 10:00:45	2026-04-02 10:00:45
1530	SHHY50566INB1PW9AJ	cargador_20w	CUBO 20 W ORIGINAL	EEUU	191.50	300.00	vendido	2026-03-31 16:43:31	2026-03-31 16:48:01
1531	SHHY5056YDK21PW9AX	cargador_20w	CUBO 20 W ORIGINAL	EEUU	191.50	300.00	vendido	2026-03-31 16:43:45	2026-03-31 16:48:01
1534	B251900013670	otro	TARJETA GEFORCE RTX 5O60TI	CARLOS EEUU	4788.90	5000.00	vendido	2026-03-31 16:56:03	2026-03-31 16:57:12
907	FUNDA_DISE_248	funda	Funda de Diseño IP 12/12PRO	CHINA	35.00	70.00	vendido	2026-02-16 12:04:04	2026-03-31 17:12:08
1532	SHHY5056EH411PW9AE	cargador_20w	CUBO 20 W ORIGINAL	EEUU	191.50	300.00	vendido	2026-03-31 16:46:00	2026-03-31 17:16:03
98	VIDRIOTEMSA:59	vidrio_templado	Vidrio Templado IP 13 PRO MAX	GZ STORES	11.00	40.00	vendido	2026-01-31 12:39:25	2026-03-31 17:20:34
111	VIDRIOTEMSA:68	vidrio_templado	Vidrio Templado IP 13/14	GZ STORES	11.00	40.00	vendido	2026-01-31 12:48:08	2026-03-31 17:20:34
1535	FUNDA_REGALO: 1	funda	FUNDA REGALO	APPLE BOSS	0.00	60.00	vendido	2026-03-31 17:17:33	2026-03-31 17:20:34
1533	SHHY5056J6H61PW9A6	cargador_20w	CUBO 20 W ORIGINAL	EEUU	191.50	300.00	vendido	2026-03-31 16:46:17	2026-03-31 18:04:00
1216	FUNDA_DISE_190	funda	Funda de Diseño IP 15 PRO MAX	CHINA	35.00	70.00	vendido	2026-02-16 13:13:11	2026-03-31 18:18:24
1536	ACCESORY: 30	accesorio	FIRE TV STICK 4K PLUS	EEUU	367.70	390.00	vendido	2026-03-31 18:58:26	2026-03-31 19:25:43
1537	CABLEUSB: 18	cargador_5w	Cable Lightning to USB	GZ STORES	24.20	100.00	disponible	2026-04-02 09:47:48	2026-04-02 09:47:48
1538	CABLEUSB: 17	cargador_5w	Cable Lightning to USB	GZ STORES	24.20	100.00	disponible	2026-04-02 09:47:54	2026-04-02 09:47:54
1539	CABLEUSB: 16	cargador_5w	Cable Lightning to USB	GZ STORES	24.20	100.00	disponible	2026-04-02 09:48:00	2026-04-02 09:48:00
1540	CABLEUSB: 15	cargador_5w	Cable Lightning to USB	GZ STORES	24.20	100.00	disponible	2026-04-02 09:48:06	2026-04-02 09:48:06
1541	CABLEUSB: 14	cargador_5w	Cable Lightning to USB	GZ STORES	24.20	100.00	disponible	2026-04-02 09:48:12	2026-04-02 09:48:12
1542	CABLEUSB: 13	cargador_5w	Cable Lightning to USB	GZ STORES	24.20	100.00	disponible	2026-04-02 09:48:17	2026-04-02 09:48:17
1543	CABLEUSB: 12	cargador_5w	Cable Lightning to USB	GZ STORES	24.20	100.00	disponible	2026-04-02 09:48:23	2026-04-02 09:48:23
1544	CABLEUSB: 11	cargador_5w	Cable Lightning to USB	GZ STORES	24.20	100.00	disponible	2026-04-02 09:48:27	2026-04-02 09:48:27
1545	CABLEUSB: 10	cargador_5w	Cable Lightning to USB	GZ STORES	24.20	100.00	disponible	2026-04-02 09:48:33	2026-04-02 09:48:33
1546	CABLEUSB: 9	cargador_5w	Cable Lightning to USB	GZ STORES	24.20	100.00	disponible	2026-04-02 09:48:42	2026-04-02 09:48:42
1547	CUBO5W: 12	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	22.00	150.00	disponible	2026-04-02 09:49:59	2026-04-02 09:49:59
1548	CUBO5W: 11	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	22.00	150.00	disponible	2026-04-02 09:50:03	2026-04-02 09:50:03
1549	CUBO5W: 10	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	22.00	150.00	disponible	2026-04-02 09:50:08	2026-04-02 09:50:08
1550	CUBO5W: 9	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	22.00	150.00	disponible	2026-04-02 09:50:14	2026-04-02 09:50:14
1551	CUBO5W: 8	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	22.00	150.00	disponible	2026-04-02 09:50:18	2026-04-02 09:50:18
1552	CUBO5W: 7	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	22.00	150.00	disponible	2026-04-02 09:50:21	2026-04-02 09:50:21
1553	CUBO5W: 6	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	22.00	150.00	disponible	2026-04-02 09:50:25	2026-04-02 09:50:25
1554	CUBO5W: 5	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	22.00	150.00	disponible	2026-04-02 09:50:30	2026-04-02 09:50:30
1555	CUBO5W: 4	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	22.00	150.00	disponible	2026-04-02 09:50:34	2026-04-02 09:50:34
1556	CUBO5W: 3	cargador_5w	CUBO 5W USB POWE ADAPTER	GZ STORES	22.00	150.00	disponible	2026-04-02 09:50:42	2026-04-02 09:50:42
1557	CUBO20W: 32	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	54.20	190.00	disponible	2026-04-02 09:56:17	2026-04-02 09:56:17
1558	CUBO20W: 31	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	54.20	190.00	disponible	2026-04-02 09:56:23	2026-04-02 09:56:23
1559	CUBO20W: 30	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	54.20	190.00	disponible	2026-04-02 09:56:28	2026-04-02 09:56:28
1560	CUBO20W: 29	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	54.20	190.00	disponible	2026-04-02 09:56:33	2026-04-02 09:56:33
1561	CUBO20W: 28	cargador_20w	CUBO 20W Calidad Origen	GZ STORES	54.20	190.00	disponible	2026-04-02 09:56:39	2026-04-02 09:56:39
1562	CABLELIGHT: 38	cargador_20w	Cable USB C - to Lightning 1m	GZ STORES	35.20	130.00	disponible	2026-04-02 09:58:23	2026-04-02 09:58:23
1563	CABLELIGHT: 37	cargador_20w	Cable USB C - to Lightning 1m	GZ STORES	35.20	130.00	disponible	2026-04-02 09:58:28	2026-04-02 09:58:28
1564	CABLELIGHT: 36	cargador_20w	Cable USB C - to Lightning 1m	GZ STORES	35.20	130.00	disponible	2026-04-02 09:58:33	2026-04-02 09:58:33
1565	CABLELIGHT: 35	cargador_20w	Cable USB C - to Lightning 1m	GZ STORES	35.20	130.00	disponible	2026-04-02 09:58:38	2026-04-02 09:58:38
1566	CABLELIGHT: 34	cargador_20w	Cable USB C - to Lightning 1m	GZ STORES	35.20	130.00	disponible	2026-04-02 09:58:42	2026-04-02 09:58:42
1567	CABLELIGHT: 33	cargador_20w	Cable USB C - to Lightning 1m	GZ STORES	35.20	130.00	disponible	2026-04-02 09:58:47	2026-04-02 09:58:47
1568	CABLELIGHT: 32	cargador_20w	Cable USB C - to Lightning 1m	GZ STORES	35.20	130.00	disponible	2026-04-02 09:58:52	2026-04-02 09:58:52
1569	CABLELIGHT: 31	cargador_20w	Cable USB C - to Lightning 1m	GZ STORES	35.20	130.00	disponible	2026-04-02 09:58:56	2026-04-02 09:58:56
1570	CABLELIGHT: 30	cargador_20w	Cable USB C - to Lightning 1m	GZ STORES	35.20	130.00	disponible	2026-04-02 09:59:02	2026-04-02 09:59:02
1571	CABLELIGHT: 29	cargador_20w	Cable USB C - to Lightning 1m	GZ STORES	35.20	130.00	disponible	2026-04-02 09:59:09	2026-04-02 09:59:09
1576	CABLECAC: 27	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	39.60	180.00	disponible	2026-04-02 10:00:50	2026-04-02 10:00:50
1577	CABLECAC: 26	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	39.60	180.00	disponible	2026-04-02 10:00:53	2026-04-02 10:00:53
1578	CABLECAC: 25	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	39.60	180.00	disponible	2026-04-02 10:00:57	2026-04-02 10:00:57
1579	CABLECAC: 24	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	39.60	180.00	disponible	2026-04-02 10:01:01	2026-04-02 10:01:01
1580	CABLECAC: 23	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	39.60	180.00	disponible	2026-04-02 10:01:05	2026-04-02 10:01:05
1581	CABLECAC: 22	cargador_20w	USB C - 60W Charge Cable 1 m	GZ STORES	39.60	180.00	disponible	2026-04-02 10:01:13	2026-04-02 10:01:13
\.


--
-- Data for Name: promociones_enviadas; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.promociones_enviadas (id, cliente_id, mensaje, canal, enviado_en, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secuencias; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.secuencias (id, clave, ultimo_numero, created_at, updated_at) FROM stdin;
2	servicio_tecnico	2	2026-02-05 20:12:39	2026-02-11 10:30:48
1	ventas	148	2026-01-31 18:19:03	2026-03-31 19:25:43
\.


--
-- Data for Name: servicio_tecnicos; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.servicio_tecnicos (id, codigo_nota, cliente, telefono, equipo, detalle_servicio, notas_adicionales, precio_costo, precio_venta, tecnico, fecha, user_id, venta_id, created_at, updated_at, cliente_id) FROM stdin;
1	AT-ST001	JOYSI	73755464	IPHONE 11	[{"descripcion":"CAMBIO DE BATERIA","costo":330,"precio":450},{"descripcion":"CAMBIO DE LENTE DE CAMARA","costo":80,"precio":100}]	\N	410.00	550.00	EDSON	2026-02-06	1	\N	2026-02-05 20:12:39	2026-02-05 20:12:39	\N
2	AT-ST002	Natalia Torrico	+591 69503773	IPHONE 15 PRO MAX	[{"descripcion":"CAMBIO DE TAPA TRASERA","costo":800,"precio":1100}]	\N	800.00	1100.00	EDSON	2026-02-11	1	\N	2026-02-11 10:30:48	2026-02-11 10:30:48	\N
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.sessions (id, user_id, ip_address, user_agent, payload, last_activity) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.users (id, name, email, email_verified_at, password, remember_token, created_at, updated_at, rol) FROM stdin;
1	Administrador	santyadmin@appleboss.com	\N	$2y$12$e3WvsQcl8S.a8kstSylPOOKwTL3NJnBY.XfUhCPR23XEdPxS2DQnC	\N	2026-01-31 10:46:27	2026-01-31 10:46:27	admin
2	Ayelen Vargas	Ayelenvargas877@gmail.com	\N	$2y$12$EYZWnbfQUUwrdslmKgxjMu7uUIE6If4N0ZEboT9BymnHLmDn1B2U2	\N	2026-01-31 10:46:27	2026-01-31 10:46:27	vendedor
3	Jhoel Abasto	jhoelabastoortega@gmail.com	\N	$2y$12$DqF/kvAoNtrIscqCfskE4eyA/eUATVYIytDgweVRhHG8IkTVJUFVe	\N	2026-01-31 10:46:27	2026-01-31 10:46:27	vendedor
\.


--
-- Data for Name: ventas; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.ventas (id, nombre_cliente, telefono_cliente, fecha, codigo_nota, tipo_venta, es_permuta, tipo_permuta, cantidad, precio_invertido, precio_venta, ganancia_neta, subtotal, descuento, celular_id, computadora_id, producto_general_id, entregado_celular_id, entregado_computadora_id, entregado_producto_general_id, metodo_pago, inicio_tarjeta, fin_tarjeta, notas_adicionales, user_id, created_at, updated_at, valor_permuta, entregado_producto_apple_id) FROM stdin;
1	BELEN ILLANES	+59169474107	2026-01-31	AT-V001	producto	f	\N	1	0.00	0.00	100.00	100.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	VENTA	1	2026-01-31 18:19:03	2026-01-31 18:19:03	0.00	\N
2	Belen Illanes	+59169474107	2026-01-31	AT-V002	producto	f	\N	1	0.00	0.00	70.00	70.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-01-31 18:44:03	2026-01-31 18:44:03	0.00	\N
3	Gonzalo Mauricio Rojas Zabala	+591 70742485	2026-02-02	AT-V003	producto	f	\N	1	0.00	0.00	8000.00	8000.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	Garantia SONY DE UN A├æO, TIENDA APPLE BOSS 6 MESES.	1	2026-02-02 19:23:14	2026-02-02 19:23:14	0.00	\N
4	Natalia Villarroel	+591 76999499	2026-02-02	AT-V004	producto	f	\N	1	0.00	0.00	20.00	20.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-02 19:32:01	2026-02-02 19:32:01	0.00	\N
5	Limbert Mercado Abasto	+591 79787199	2026-02-02	AT-V005	producto	f	\N	1	0.00	0.00	135.00	135.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-02 19:33:24	2026-02-02 19:33:24	0.00	\N
6	CLIENTE	0	2026-02-02	AT-V006	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-02 19:33:50	2026-02-02 19:33:50	0.00	\N
7	ERIK LUIS TADEO	+591 72588300	2026-02-03	AT-V007	producto	f	\N	1	0.00	0.00	16100.00	16100.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	GARANTIA 3 MESES.	1	2026-02-03 19:43:46	2026-02-03 19:43:46	0.00	\N
8	HEBER GARCIA	+591 74166564	2026-02-04	AT-V008	producto	f	\N	1	0.00	0.00	9000.00	9000.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GARANTIA 3 MESES EN ASPECTOS DE FABRICA.	1	2026-02-04 12:07:05	2026-02-04 12:07:05	0.00	\N
9	Wara Herbas	+591 69921625	2026-02-04	AT-V009	producto	f	\N	1	0.00	0.00	5040.00	5040.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	Garantia 3 meses, todo Funcional.	1	2026-02-04 18:13:24	2026-02-04 18:13:24	0.00	\N
10	Adrian Camacho	-	2026-02-04	AT-V010	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-04 19:36:50	2026-02-04 19:36:50	0.00	\N
11	Paola Acosta Rodriguez	+591 75907425	2026-02-05	AT-V011	producto	f	\N	1	0.00	0.00	14150.00	14150.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	Garantia 1 a├▒o de fabrica.	1	2026-02-05 14:10:27	2026-02-05 14:10:27	0.00	\N
12	Alejandro Ledezma	+591 69499736	2026-02-05	AT-V012	producto	f	\N	1	0.00	0.00	3090.00	3090.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	Garantia 1 a├▒o Apple airpods, Garantia Cable 1 M C a C 3 meses.	3	2026-02-05 15:37:00	2026-02-05 15:37:00	0.00	\N
13	CRISTIAN OPORTO RODAS	68383878	2026-02-05	AT-V013	producto	f	\N	1	0.00	0.00	3700.00	3700.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-05 20:14:35	2026-02-05 20:14:35	0.00	\N
14	Angelica Pol	+591 77439811	2026-02-07	AT-V014	producto	f	\N	1	0.00	0.00	6500.00	6500.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	Garantia 3 meses de tienda.	1	2026-02-07 11:00:24	2026-02-07 11:00:24	0.00	\N
15	Melisa Camacho	+591 79799800	2026-02-07	AT-V015	producto	f	\N	1	0.00	0.00	9000.00	9000.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	Garantia 3 meses de tienda en todo aspecto funcional.	1	2026-02-07 11:13:57	2026-02-07 11:13:57	0.00	\N
16	Nicolas Pardo	+591 75955568	2026-02-07	AT-V016	producto	f	\N	1	0.00	0.00	190.00	190.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	Garantia 3 meses.	1	2026-02-07 12:44:13	2026-02-07 12:44:13	0.00	\N
17	Lourdes Herrera	+591 60353124	2026-02-10	AT-V017	producto	f	\N	1	0.00	0.00	2800.00	2800.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	Garantia equipos sellados de un a├▒o , y powerbank 3 meses.	2	2026-02-10 14:26:54	2026-02-10 14:26:54	0.00	\N
18	Glenda Torrico	+591 60378633	2026-02-10	AT-V018	producto	f	\N	1	0.00	0.00	1520.00	1520.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	Garantia 1 a├▒o en equipos nuevos.	1	2026-02-10 14:29:48	2026-02-10 14:29:48	0.00	\N
19	Maria Celeste Gutierrez	+591 79257665	2026-02-10	AT-V019	producto	f	\N	1	0.00	0.00	12600.00	12600.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	Garantia 1 a├▒o de apple.	1	2026-02-10 14:34:41	2026-02-10 14:34:41	0.00	\N
20	Cliente	0	2026-02-10	AT-V020	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-10 14:35:48	2026-02-10 14:35:48	0.00	\N
21	Cliente	0	2026-02-10	AT-V021	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-10 14:36:08	2026-02-10 14:36:08	0.00	\N
22	Mendoza	+591 76400695	2026-02-10	AT-V022	producto	f	\N	1	0.00	0.00	540.00	540.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	Garantia 3 meses.	1	2026-02-10 14:38:39	2026-02-10 14:38:39	0.00	\N
23	Owen Lovera Zarate	+591 71846825	2026-02-10	AT-V023	producto	f	\N	1	0.00	0.00	1400.00	1400.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	Garantia 1 a├▒o de fabrica.	1	2026-02-10 14:40:26	2026-02-10 14:40:26	0.00	\N
24	Ccantu Aroiste	+591 62709689	2026-02-10	AT-V024	producto	f	\N	1	0.00	0.00	1700.00	1700.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	Garantia 3 meses de tienda.	1	2026-02-10 14:41:56	2026-02-10 14:41:56	0.00	\N
25	Cliente	0	2026-02-11	AT-V025	producto	f	\N	1	0.00	0.00	110.00	110.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-11 10:21:33	2026-02-11 10:21:33	0.00	\N
26	Alejandro Benjamin Torrez Apaza	+591 67935446	2026-02-11	AT-V026	producto	f	\N	1	0.00	0.00	6100.00	6100.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	Garantia 3 meses.	1	2026-02-11 10:24:34	2026-02-11 10:24:34	0.00	\N
27	Eber Cruz	+591 68750366	2026-02-11	AT-V027	producto	f	\N	1	0.00	0.00	4700.00	4700.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	Garantia 3 meses, funcionalmente.	1	2026-02-11 10:29:35	2026-02-11 10:29:35	0.00	\N
28	Carlos Rodriguez	-	2026-02-11	AT-V028	producto	f	\N	1	0.00	0.00	100.00	100.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-11 11:02:07	2026-02-11 11:02:07	0.00	\N
29	Mijail Pinchi Condori	+59175410132	2026-02-13	AT-V029	producto	f	\N	1	0.00	0.00	6200.00	6200.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	Garantia 3 meses de tienda, todo lo que es funcional.	1	2026-02-13 23:31:16	2026-02-13 23:31:16	0.00	\N
30	Carlos Rodriguez	+5910	2026-02-13	AT-V030	producto	f	\N	1	0.00	0.00	190.00	190.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-13 23:34:32	2026-02-13 23:34:32	0.00	\N
31	MATIAS CLAURE	+591 69469753	2026-02-13	AT-V031	producto	f	\N	1	0.00	0.00	4170.00	4170.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GARANTIA 3 MESES DE FUNCIONAMIENTO, NO APLICA POR CAUSAS DE AGUA O CAIDA, O EN DEFECTO MANIPULACION POR TERCEROS.	1	2026-02-13 23:50:25	2026-02-13 23:50:25	0.00	\N
32	CLIENTE	+5910	2026-02-13	AT-V032	producto	f	\N	1	0.00	0.00	110.00	110.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-13 23:53:20	2026-02-13 23:53:20	0.00	\N
33	LISBETH CRUCES	+591 76482843	2026-02-13	AT-V033	producto	f	\N	1	0.00	0.00	520.00	520.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-13 23:55:09	2026-02-13 23:55:09	0.00	\N
34	DERECK ALEJANDRO HERBAS	+591 68507342	2026-02-14	AT-V034	producto	f	\N	1	0.00	0.00	8015.00	8015.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GARANTIA DE FABRICA 1 A├æO. APPLE RESPALDA.	1	2026-02-14 00:08:32	2026-02-14 00:08:32	0.00	\N
35	SOFIA DUARTE	+595 973464565	2026-02-14	AT-V035	producto	f	\N	1	0.00	0.00	8550.00	8550.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GARANTIA DE 1 A├æO.	1	2026-02-14 00:13:38	2026-02-14 00:13:38	0.00	\N
36	ANGELO LIMA	+591 68350114	2026-02-14	AT-V036	producto	f	\N	1	0.00	0.00	3600.00	3600.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-14 00:20:43	2026-02-14 00:20:43	0.00	\N
37	CLIENTE	+5910	2026-02-14	AT-V037	producto	f	\N	1	0.00	0.00	900.00	900.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-14 00:24:01	2026-02-14 00:24:01	0.00	\N
38	CLIENTE	+5910	2026-02-14	AT-V038	producto	f	\N	1	0.00	0.00	750.00	750.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-14 00:25:12	2026-02-14 00:25:12	0.00	\N
39	CLAUDIA ABASTO LOPEZ	+591 77915645	2026-02-14	AT-V039	producto	f	\N	1	0.00	0.00	380.00	380.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-14 00:26:50	2026-02-14 00:26:50	0.00	\N
40	ANGEL LOPEZ	0	2026-02-14	AT-V040	producto	f	\N	1	0.00	0.00	320.00	320.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-14 21:40:56	2026-02-14 21:40:56	0.00	\N
41	SAMUEL EGUINO	+591 79776992	2026-02-14	AT-V041	producto	f	\N	1	0.00	0.00	11900.00	11900.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	GARANTIA 1 AÑO DE FABRICA , 1 AÑO TIENDA APPLE BOSS	1	2026-02-14 21:42:16	2026-02-14 21:42:16	0.00	\N
42	GARY VALERIANO QUISPE	+591 61606171	2026-02-14	AT-V042	producto	f	\N	1	0.00	0.00	13900.00	13900.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GARANTIA 1 AÑO DE FABRICA	1	2026-02-14 21:58:24	2026-02-14 21:58:24	0.00	\N
43	GABRIEL ARANIBAR	+591 65380407	2026-02-14	AT-V043	producto	f	\N	1	0.00	0.00	9670.00	9670.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GARANTIA DE FABRICA 1 AÑO , EN TODO ASPECTO FUNCIONAL DEL EQUIPO.	1	2026-02-14 22:04:45	2026-02-14 22:04:45	0.00	\N
44	ARIEL ABASTO COSSIO	+591 75472050	2026-02-14	AT-V044	producto	f	\N	1	0.00	0.00	290.00	290.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GARANTIA 3 MESES	1	2026-02-14 22:08:30	2026-02-14 22:08:30	0.00	\N
45	ANDRES SAAVEDRA	+591 67430625	2026-02-14	AT-V045	producto	f	\N	1	0.00	0.00	7590.00	7590.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GARANTIA 1 AÑO DE FABRICA.	1	2026-02-14 22:15:54	2026-02-14 22:15:54	0.00	\N
46	ANGIE COPA	+591 67470500	2026-02-14	AT-V046	producto	f	\N	1	0.00	0.00	3300.00	3300.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GARANTIA 3 MESES .	1	2026-02-14 22:18:46	2026-02-14 22:18:46	0.00	\N
47	ADELA ANDRADE	+591 79415788	2026-02-15	AT-V047	producto	f	\N	1	0.00	0.00	7360.00	7360.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	GARANTÍA 1 AÑO: Este producto cuenta con un año de garantía por funcionamiento, válida únicamente por fallas técnicas de fábrica que afecten el uso normal del equipo bajo condiciones adecuadas. La garantía cubre defectos internos de hardware y no aplica en casos de golpes, caídas, daños por líquidos, manipulación o apertura no autorizada, daños eléctricos, desgaste natural de batería o accesorios, ni bloqueos o alteraciones de software. Para hacer válida la garantía es indispensable presentar la nota de venta correspondiente.	1	2026-02-15 21:31:24	2026-02-15 21:31:24	0.00	\N
48	cliente	0	2026-02-18	AT-V048	producto	f	\N	1	0.00	0.00	160.00	160.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-18 22:31:57	2026-02-18 22:31:57	0.00	\N
49	ARIANA VILLEGAS	+591 70719895	2026-02-18	AT-V049	producto	f	\N	1	0.00	0.00	9660.00	9660.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GARANTIA FUNCIONAL 1 AÑO.	1	2026-02-18 22:45:21	2026-02-18 22:45:21	0.00	\N
50	LOIDA DURAN	+591 76077366	2026-02-18	AT-V050	producto	f	\N	1	0.00	0.00	12540.00	12540.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GARANTIA 1 AÑO FUNCIONAL.	1	2026-02-18 22:49:16	2026-02-18 22:49:16	0.00	\N
51	Abdiel Antezana	+591 72281027	2026-02-20	AT-V051	producto	f	\N	1	0.00	0.00	740.00	740.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-20 13:00:03	2026-02-20 13:00:03	0.00	\N
52	Rene Lazaro	+591 76463753	2026-02-20	AT-V052	producto	f	\N	1	0.00	0.00	18500.00	18500.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-20 13:01:23	2026-02-20 13:01:23	0.00	\N
53	Rodrigo Delgado	+591 60719762	2026-02-20	AT-V053	producto	f	\N	1	0.00	0.00	4100.00	4100.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-20 13:03:07	2026-02-20 13:03:07	0.00	\N
54	Limbert Mercado Abasto	+591 79787199	2026-02-20	AT-V054	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-20 13:03:58	2026-02-20 13:03:58	0.00	\N
55	NAYRA COCA	+591 60765033	2026-02-20	AT-V055	producto	f	\N	1	0.00	0.00	110.00	110.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-20 13:04:57	2026-02-20 13:04:57	0.00	\N
56	ELVIS YAPURA	+591 64870957	2026-02-20	AT-V056	producto	f	\N	1	0.00	0.00	4100.00	4100.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-20 17:24:00	2026-02-20 17:24:00	0.00	\N
57	RICARDO ZELAYA	+591 74576666	2026-02-20	AT-V057	producto	f	\N	1	0.00	0.00	320.00	320.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-20 20:15:38	2026-02-20 20:15:38	0.00	\N
58	CLIENTE	0	2026-02-20	AT-V058	producto	f	\N	1	0.00	0.00	360.00	360.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-20 20:17:07	2026-02-20 20:17:07	0.00	\N
59	LEANDRO SEVERICHE	+591 78345472	2026-02-23	AT-V059	producto	f	\N	1	0.00	0.00	13800.00	13800.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-23 10:07:03	2026-02-23 10:07:03	0.00	\N
60	JENNIFER YUCRA	+591 76902704	2026-02-23	AT-V060	producto	f	\N	1	0.00	0.00	130.00	130.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-23 10:13:38	2026-02-23 10:13:38	0.00	\N
61	JOSE CAYO ROQUE	+591 62661720	2026-02-23	AT-V061	producto	f	\N	1	0.00	0.00	7900.00	7900.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-23 10:15:53	2026-02-23 10:15:53	0.00	\N
62	ISABEL PIEROLA	+591 64309353	2026-02-23	AT-V062	producto	f	\N	1	0.00	0.00	100.00	100.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-23 10:17:04	2026-02-23 10:17:04	0.00	\N
63	MARIA EDUARDA GOMES	+591 77442439	2026-02-23	AT-V063	producto	f	\N	1	0.00	0.00	1750.00	1750.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-23 19:35:51	2026-02-23 19:35:51	0.00	\N
64	SNEYDER CHIRINO	+591 76968031	2026-02-23	AT-V064	producto	f	\N	1	0.00	0.00	180.00	180.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-23 19:36:45	2026-02-23 19:36:45	0.00	\N
65	JAYONNE CAMACHO RIVERA	+591 69542006	2026-02-23	AT-V065	producto	f	\N	1	0.00	0.00	775.00	775.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-23 19:39:58	2026-02-23 19:39:58	0.00	\N
66	ALDAIR MOLLEGA	-	2026-02-24	AT-V066	producto	f	\N	1	0.00	0.00	100.00	100.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-24 19:56:13	2026-02-24 19:56:13	0.00	\N
67	JONATHAN TORREZ	+591 75963943	2026-02-24	AT-V067	producto	f	\N	1	0.00	0.00	7600.00	7600.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-24 19:57:22	2026-02-24 19:57:22	0.00	\N
68	-	-	2026-02-24	AT-V068	producto	f	\N	1	0.00	0.00	100.00	100.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-24 19:58:48	2026-02-24 19:58:48	0.00	\N
69	JUAN RAFAEL BRAÑEZ PEREIRA	-	2026-02-24	AT-V069	producto	f	\N	1	0.00	0.00	9540.00	9540.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-02-24 20:00:01	2026-02-24 20:00:01	0.00	\N
70	-	-	2026-02-24	AT-V070	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-24 20:00:22	2026-02-24 20:00:22	0.00	\N
71	-	-	2026-02-26	AT-V071	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-26 19:26:43	2026-02-26 19:26:43	0.00	\N
72	MARCELO VISCARRA	+591 75920060	2026-02-26	AT-V072	producto	f	\N	1	0.00	0.00	7200.00	7200.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-02-26 19:28:19	2026-02-26 19:28:19	0.00	\N
73	-	-	2026-03-09	AT-V073	producto	f	\N	1	0.00	0.00	100.00	100.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-09 09:36:29	2026-03-09 09:36:29	0.00	\N
74	-	-	2026-03-09	AT-V074	producto	f	\N	1	0.00	0.00	160.00	160.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 09:37:27	2026-03-09 09:37:27	0.00	\N
75	-	-	2026-03-09	AT-V075	producto	f	\N	1	0.00	0.00	60.00	60.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 09:38:07	2026-03-09 09:38:07	0.00	\N
76	JHONNY MAMANI VELASQUEZ	+591 75939001	2026-03-09	AT-V076	producto	f	\N	1	0.00	0.00	6500.00	6500.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 10:05:51	2026-03-09 10:05:51	0.00	\N
77	NICOL VILLARROEL	+591 60728212	2026-03-09	AT-V077	producto	f	\N	1	0.00	0.00	5340.00	5340.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 10:08:26	2026-03-09 10:08:26	0.00	\N
78	-	-	2026-03-09	AT-V078	producto	f	\N	1	0.00	0.00	100.00	100.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 10:46:27	2026-03-09 10:46:27	0.00	\N
79	ANAHI ROJAS	+591 75479967	2026-03-09	AT-V079	producto	f	\N	1	0.00	0.00	13900.00	13900.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 11:29:57	2026-03-09 11:29:57	0.00	\N
80	INGRID MERCADO	+591	2026-03-09	AT-V080	producto	f	\N	1	0.00	0.00	26400.00	26400.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 11:31:55	2026-03-09 11:31:55	0.00	\N
82	Edwin Yucra Gutierrez	+591 79371306	2026-03-09	AT-V082	producto	f	\N	1	0.00	0.00	6020.00	6020.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 19:26:09	2026-03-09 19:26:09	0.00	\N
83	-	-	2026-03-09	AT-V083	producto	f	\N	1	0.00	0.00	140.00	140.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 19:26:48	2026-03-09 19:26:48	0.00	\N
84	-	-	2026-03-09	AT-V084	producto	f	\N	1	0.00	0.00	100.00	100.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 19:28:49	2026-03-09 19:28:49	0.00	\N
85	-	-	2026-03-09	AT-V085	producto	f	\N	1	0.00	0.00	170.00	170.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-09 19:29:28	2026-03-09 19:29:28	0.00	\N
86	JUAN CARLOS EYZAGUIRRE	+591 70740087	2026-03-09	AT-V086	producto	f	\N	1	0.00	0.00	13360.00	13360.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-09 19:39:18	2026-03-09 19:39:18	0.00	\N
87	-	-	2026-03-09	AT-V087	producto	f	\N	1	0.00	0.00	140.00	140.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 19:39:58	2026-03-09 19:39:58	0.00	\N
88	RICHAR HINOJOSA FLORES	+591 61355691	2026-03-09	AT-V088	producto	f	\N	1	0.00	0.00	3540.00	3540.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 19:41:34	2026-03-09 19:41:34	0.00	\N
89	-	-	2026-03-09	AT-V089	producto	f	\N	1	0.00	0.00	140.00	140.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 19:43:49	2026-03-09 19:43:49	0.00	\N
90	GABRIELA MERINO	+591 68428841	2026-03-09	AT-V090	producto	f	\N	1	0.00	0.00	2250.00	2250.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-09 19:47:31	2026-03-09 19:47:31	0.00	\N
91	SERGIO CARO	+591 67501906	2026-03-09	AT-V091	producto	f	\N	1	0.00	0.00	13850.00	13850.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 19:51:40	2026-03-09 19:51:40	0.00	\N
92	CRISTIAN TORREZ CHOQUE	+591 71428201	2026-03-09	AT-V092	producto	f	\N	1	0.00	0.00	8100.00	8100.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-09 19:59:18	2026-03-09 19:59:18	0.00	\N
93	ARIEL VARGAS	+591 69473826	2026-03-09	AT-V093	producto	f	\N	1	0.00	0.00	6900.00	6900.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 20:00:24	2026-03-09 20:00:24	0.00	\N
94	ALEJANDRO JUNIOR RAMIREZ	+591 71114484	2026-03-09	AT-V094	producto	f	\N	1	0.00	0.00	13400.00	13400.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-09 20:01:36	2026-03-09 20:01:36	0.00	\N
95	-	-	2026-03-09	AT-V095	producto	f	\N	1	0.00	0.00	60.00	60.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-09 20:02:11	2026-03-09 20:02:11	0.00	\N
96	CRISTINA ROJAS	+591 74465176	2026-03-10	AT-V096	producto	f	\N	1	0.00	0.00	9440.00	9440.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-10 09:23:57	2026-03-10 09:23:57	0.00	\N
97	ALEJANDRO OLGUIN	+591 76986000	2026-03-10	AT-V097	producto	f	\N	1	0.00	0.00	17100.00	17100.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-10 19:05:09	2026-03-10 19:05:09	0.00	\N
98	PAOLA ALVAREZ	-	2026-03-10	AT-V098	producto	f	\N	1	0.00	0.00	390.00	390.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-10 19:08:52	2026-03-10 19:08:52	0.00	\N
99	-	-	2026-03-10	AT-V099	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-10 19:09:16	2026-03-10 19:09:16	0.00	\N
100	ANDRES CUEVAS	-	2026-03-12	AT-V100	producto	f	\N	1	0.00	0.00	7450.00	7450.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-12 19:30:53	2026-03-12 19:30:53	0.00	\N
101	-	-	2026-03-13	AT-V101	producto	f	\N	1	0.00	0.00	780.00	780.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-13 19:20:06	2026-03-13 19:20:06	0.00	\N
102	Ingrid Mercado	+591	2026-03-13	AT-V102	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-13 19:20:55	2026-03-13 19:20:55	0.00	\N
103	JORGE GALDO	+591 77702859	2026-03-13	AT-V103	producto	f	\N	1	0.00	0.00	6850.00	6850.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-13 19:23:22	2026-03-13 19:23:22	0.00	\N
104	JOSE OSVALDO MONTERO CACERES	+591 78805120	2026-03-16	AT-V104	producto	f	\N	1	0.00	0.00	2940.00	2940.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-16 19:43:01	2026-03-16 19:43:01	0.00	\N
105	Natalia Villarroel	+591 76999499	2026-03-16	AT-V105	producto	f	\N	1	0.00	0.00	170.00	170.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-16 19:44:44	2026-03-16 19:44:44	0.00	\N
106	VALLEJOS	+591 75934926	2026-03-16	AT-V106	producto	f	\N	1	0.00	0.00	540.00	540.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-16 19:46:33	2026-03-16 19:46:33	0.00	\N
107	SEBASTIAN MATEO PARIHUANCOLLO	+591 60758067	2026-03-16	AT-V107	producto	f	\N	1	0.00	0.00	2300.00	2300.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-16 19:47:28	2026-03-16 19:47:28	0.00	\N
108	PAOLA PEREZ	+591 72296222	2026-03-17	AT-V108	producto	f	\N	1	0.00	0.00	9730.00	9730.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-17 09:51:58	2026-03-17 09:51:58	0.00	\N
109	Ricardo Zelaya	+591 74576666	2026-03-17	AT-V109	producto	f	\N	1	0.00	0.00	390.00	390.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-17 19:09:31	2026-03-17 19:09:31	0.00	\N
110	ANTICUARIO EL INSOMNIO	+591 65331279	2026-03-17	AT-V110	producto	f	\N	1	0.00	0.00	535.00	535.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-17 19:10:10	2026-03-17 19:10:10	0.00	\N
111	-	-	2026-03-17	AT-V111	producto	f	\N	1	0.00	0.00	50.00	50.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-17 19:11:08	2026-03-17 19:11:08	0.00	\N
112	-	-	2026-03-17	AT-V112	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-17 19:12:06	2026-03-17 19:12:06	0.00	\N
113	-	-	2026-03-17	AT-V113	producto	f	\N	1	0.00	0.00	320.00	320.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-17 19:13:17	2026-03-17 19:13:17	0.00	\N
114	DAFNE LUNA MENDEZ	+591 75468828	2026-03-17	AT-V114	producto	f	\N	1	0.00	0.00	540.00	540.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-17 19:15:29	2026-03-17 19:15:29	0.00	\N
115	-	-	2026-03-19	AT-V115	producto	f	\N	1	0.00	0.00	130.00	130.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-19 09:40:26	2026-03-19 09:40:26	0.00	\N
116	-	-	2026-03-19	AT-V116	producto	f	\N	1	0.00	0.00	100.00	100.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-19 09:40:57	2026-03-19 09:40:57	0.00	\N
117	-	-	2026-03-19	AT-V117	producto	f	\N	1	0.00	0.00	200.00	200.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-19 09:49:00	2026-03-19 09:49:00	0.00	\N
118	MARCELO CATARI	+591 67907352	2026-03-20	AT-V118	producto	f	\N	1	0.00	0.00	9500.00	9500.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-20 11:37:07	2026-03-20 11:37:07	0.00	\N
119	MARIA INES MORALES	+591 70780240	2026-03-20	AT-V119	producto	f	\N	1	0.00	0.00	7450.00	7450.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-20 13:11:11	2026-03-20 13:11:11	0.00	\N
120	MARIA CHOQUE	+591 77493181	2026-03-23	AT-V120	producto	f	\N	1	0.00	0.00	140.00	140.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-23 09:34:58	2026-03-23 09:34:58	0.00	\N
121	-	-	2026-03-23	AT-V121	producto	f	\N	1	0.00	0.00	610.00	610.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-23 09:35:50	2026-03-23 09:35:50	0.00	\N
122	MIJAEL REYES	+591 73803531	2026-03-23	AT-V122	producto	f	\N	1	0.00	0.00	400.00	400.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-23 09:43:09	2026-03-23 09:43:09	0.00	\N
123	-	-	2026-03-24	AT-V123	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-24 09:30:34	2026-03-24 09:30:34	0.00	\N
124	-	-	2026-03-24	AT-V124	producto	f	\N	1	0.00	0.00	100.00	100.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-24 19:38:26	2026-03-24 19:38:26	0.00	\N
125	ANTONELA PALOMINO	+591 76459234	2026-03-27	AT-V125	producto	f	\N	1	0.00	0.00	4600.00	4600.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-27 10:21:16	2026-03-27 10:21:16	0.00	\N
126	Claudia Abasto Lopez	+591 77915645	2026-03-27	AT-V126	producto	f	\N	1	0.00	0.00	250.00	250.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-27 10:31:55	2026-03-27 10:31:55	0.00	\N
127	-	-	2026-03-27	AT-V127	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-27 10:33:48	2026-03-27 10:33:48	0.00	\N
128	-	-	2026-03-27	AT-V128	producto	f	\N	1	0.00	0.00	200.00	200.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-27 10:34:08	2026-03-27 10:34:08	0.00	\N
129	MAIRA SANJINES	+591 79678871	2026-03-27	AT-V129	producto	f	\N	1	0.00	0.00	380.00	380.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-27 10:34:57	2026-03-27 10:34:57	0.00	\N
130	KELLY SALCEDO	+591 76443533	2026-03-31	AT-V130	producto	f	\N	1	0.00	0.00	6400.00	6400.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 16:27:22	2026-03-31 16:27:22	0.00	\N
131	ADRIANA DORADO	+591 60771838	2026-03-31	AT-V131	producto	f	\N	1	0.00	0.00	560.00	560.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 16:48:01	2026-03-31 16:48:01	0.00	\N
132	RONALD SAAVEDRA	+591 78570125	2026-03-31	AT-V132	producto	f	\N	1	0.00	0.00	5000.00	5000.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 16:57:12	2026-03-31 16:57:12	0.00	\N
133	JOHNNY SUAREZ	+591 75985105	2026-03-31	AT-V133	producto	f	\N	1	0.00	0.00	6640.00	6640.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-31 17:12:08	2026-03-31 17:12:08	0.00	\N
134	-	-	2026-03-31	AT-V134	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 17:12:46	2026-03-31 17:12:46	0.00	\N
135	RICARDO AVILES	+591 70345444	2026-03-31	AT-V135	producto	f	\N	1	0.00	0.00	600.00	600.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 17:16:03	2026-03-31 17:16:03	0.00	\N
136	-	-	2026-03-31	AT-V136	producto	f	\N	1	0.00	0.00	180.00	180.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 17:20:34	2026-03-31 17:20:34	0.00	\N
137	RODRIGO CALVIMONTES	+591 71485098	2026-03-31	AT-V137	producto	f	\N	1	0.00	0.00	3070.00	3070.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-31 17:26:36	2026-03-31 17:26:36	0.00	\N
138	MIREYA ESCOBAR	+591 67496621	2026-03-31	AT-V138	producto	f	\N	1	0.00	0.00	5989.00	5989.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-31 17:39:55	2026-03-31 17:39:55	0.00	\N
139	MICHELLE RAMOS	+591 60362820	2026-03-31	AT-V139	producto	f	\N	1	0.00	0.00	1900.00	1900.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 17:47:10	2026-03-31 17:47:10	0.00	\N
140	CAMILA SHANIK COLQUE SANDY	+591 71762884	2026-03-31	AT-V140	producto	f	\N	1	0.00	0.00	5240.00	5240.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	\N	1	2026-03-31 17:54:24	2026-03-31 17:54:24	0.00	\N
141	-	-	2026-03-31	AT-V141	producto	f	\N	1	0.00	0.00	40.00	40.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 17:54:42	2026-03-31 17:54:42	0.00	\N
142	YADHIRA LLANOS SAAVEDRA	+591 67335457	2026-03-31	AT-V142	producto	f	\N	1	0.00	0.00	22900.00	22900.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 17:57:46	2026-03-31 17:57:46	0.00	\N
143	CARLOS MARIN	+591 60366036	2026-03-31	AT-V143	producto	f	\N	1	0.00	0.00	290.00	290.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 18:04:00	2026-03-31 18:04:00	0.00	\N
144	-	-	2026-03-31	AT-V144	producto	f	\N	1	0.00	0.00	100.00	100.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	GANADOR APUESTA PARTIDO	1	2026-03-31 18:17:04	2026-03-31 18:17:04	0.00	\N
145	-	-	2026-03-31	AT-V145	producto	f	\N	1	0.00	0.00	70.00	70.00	0.00	\N	\N	\N	\N	\N	\N	efectivo	\N	\N	GANADOR APUESTA PARTIDO	1	2026-03-31 18:18:24	2026-03-31 18:18:24	0.00	\N
146	JOHANN PEREIRA MOLINA	+591 60713021	2026-03-31	AT-V146	producto	f	\N	1	0.00	0.00	7300.00	7300.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 18:46:18	2026-03-31 18:46:18	0.00	\N
147	SAMIRA NUÑEZ ANTEZANA	+591 67466816	2026-03-31	AT-V147	producto	f	\N	1	0.00	0.00	7950.00	7950.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 19:24:22	2026-03-31 19:24:22	0.00	\N
148	JORGE VILLEGAS	69463010	2026-03-31	AT-V148	producto	f	\N	1	0.00	0.00	390.00	390.00	0.00	\N	\N	\N	\N	\N	\N	qr	\N	\N	\N	1	2026-03-31 19:25:43	2026-03-31 19:25:43	0.00	\N
\.


--
-- Data for Name: ventas_items; Type: TABLE DATA; Schema: public; Owner: user
--

COPY public.ventas_items (id, venta_id, tipo, producto_id, cantidad, precio_venta, precio_invertido, descuento, subtotal, created_at, updated_at) FROM stdin;
1	1	producto_general	267	1	60.00	20.00	0.00	60.00	2026-01-31 18:19:03	2026-01-31 18:19:03
2	1	producto_general	62	1	40.00	11.00	0.00	40.00	2026-01-31 18:19:03	2026-01-31 18:19:03
3	2	producto_general	268	1	70.00	20.00	0.00	70.00	2026-01-31 18:44:03	2026-01-31 18:44:03
4	3	producto_general	287	1	8000.00	7188.00	0.00	8000.00	2026-02-02 19:23:14	2026-02-02 19:23:14
5	4	producto_general	288	1	20.00	20.00	0.00	20.00	2026-02-02 19:32:01	2026-02-02 19:32:01
6	5	producto_general	289	1	95.00	40.00	0.00	95.00	2026-02-02 19:33:24	2026-02-02 19:33:24
7	5	producto_general	212	1	40.00	11.00	0.00	40.00	2026-02-02 19:33:24	2026-02-02 19:33:24
8	6	producto_general	206	1	40.00	11.00	0.00	40.00	2026-02-02 19:33:50	2026-02-02 19:33:50
9	7	celular	1	1	15810.00	14880.00	0.00	15810.00	2026-02-03 19:43:46	2026-02-03 19:43:46
10	7	producto_general	210	1	40.00	11.00	0.00	40.00	2026-02-03 19:43:46	2026-02-03 19:43:46
11	7	producto_general	290	1	250.00	200.00	0.00	250.00	2026-02-03 19:43:46	2026-02-03 19:43:46
12	8	computadora	1	1	9000.00	8767.00	0.00	9000.00	2026-02-04 12:07:05	2026-02-04 12:07:05
13	9	celular	2	1	4800.00	3100.00	0.00	4800.00	2026-02-04 18:13:24	2026-02-04 18:13:24
14	9	producto_general	388	1	60.00	20.00	0.00	60.00	2026-02-04 18:13:24	2026-02-04 18:13:24
15	9	producto_general	389	1	140.00	45.00	0.00	140.00	2026-02-04 18:13:24	2026-02-04 18:13:24
16	9	producto_general	95	1	40.00	11.00	0.00	40.00	2026-02-04 18:13:24	2026-02-04 18:13:24
17	10	producto_general	166	1	40.00	11.00	0.00	40.00	2026-02-04 19:36:50	2026-02-04 19:36:50
18	11	celular	9	1	13600.00	13049.00	0.00	13600.00	2026-02-05 14:10:27	2026-02-05 14:10:27
19	11	producto_general	443	1	110.00	90.00	0.00	110.00	2026-02-05 14:10:27	2026-02-05 14:10:27
20	11	producto_general	420	1	400.00	200.00	0.00	400.00	2026-02-05 14:10:27	2026-02-05 14:10:27
21	11	producto_general	215	1	40.00	11.00	0.00	40.00	2026-02-05 14:10:27	2026-02-05 14:10:27
22	12	producto_apple	1	1	2900.00	2300.00	0.00	2900.00	2026-02-05 15:37:00	2026-02-05 15:37:00
23	12	producto_general	421	1	190.00	54.00	0.00	190.00	2026-02-05 15:37:00	2026-02-05 15:37:00
24	13	celular	10	1	3700.00	3291.00	0.00	3700.00	2026-02-05 20:14:35	2026-02-05 20:14:35
25	14	computadora	2	1	6500.00	5600.00	0.00	6500.00	2026-02-07 11:00:24	2026-02-07 11:00:24
26	15	computadora	3	1	9000.00	7000.00	0.00	9000.00	2026-02-07 11:13:57	2026-02-07 11:13:57
27	16	producto_general	401	1	190.00	45.00	0.00	190.00	2026-02-07 12:44:13	2026-02-07 12:44:13
28	17	producto_apple	2	1	1200.00	916.00	0.00	1200.00	2026-02-10 14:26:54	2026-02-10 14:26:54
29	17	producto_apple	3	1	1200.00	916.00	0.00	1200.00	2026-02-10 14:26:54	2026-02-10 14:26:54
30	17	producto_general	444	1	590.00	200.00	190.00	400.00	2026-02-10 14:26:54	2026-02-10 14:26:54
31	18	producto_apple	4	1	1520.00	1236.60	0.00	1520.00	2026-02-10 14:29:48	2026-02-10 14:29:48
32	19	celular	12	1	12310.00	11450.00	0.00	12310.00	2026-02-10 14:34:41	2026-02-10 14:34:41
33	19	producto_general	396	1	190.00	45.00	0.00	190.00	2026-02-10 14:34:41	2026-02-10 14:34:41
34	19	producto_general	205	1	40.00	11.00	0.00	40.00	2026-02-10 14:34:41	2026-02-10 14:34:41
35	19	producto_general	445	1	60.00	20.00	0.00	60.00	2026-02-10 14:34:41	2026-02-10 14:34:41
36	20	producto_general	150	1	40.00	11.00	0.00	40.00	2026-02-10 14:35:48	2026-02-10 14:35:48
37	21	producto_general	211	1	40.00	11.00	0.00	40.00	2026-02-10 14:36:08	2026-02-10 14:36:08
38	22	producto_general	408	1	130.00	45.00	25.00	105.00	2026-02-10 14:38:39	2026-02-10 14:38:39
39	22	producto_general	394	1	190.00	45.00	25.00	165.00	2026-02-10 14:38:39	2026-02-10 14:38:39
40	22	producto_general	390	1	190.00	45.00	25.00	165.00	2026-02-10 14:38:39	2026-02-10 14:38:39
41	22	producto_general	409	1	130.00	45.00	25.00	105.00	2026-02-10 14:38:39	2026-02-10 14:38:39
42	23	producto_apple	5	1	1400.00	1007.60	0.00	1400.00	2026-02-10 14:40:26	2026-02-10 14:40:26
43	24	celular	3	1	1700.00	1000.00	0.00	1700.00	2026-02-10 14:41:56	2026-02-10 14:41:56
44	25	producto_general	142	1	40.00	11.00	0.00	40.00	2026-02-11 10:21:33	2026-02-11 10:21:33
45	25	producto_general	446	1	70.00	20.00	0.00	70.00	2026-02-11 10:21:33	2026-02-11 10:21:33
46	26	producto_general	447	1	6100.00	5487.13	0.00	6100.00	2026-02-11 10:24:34	2026-02-11 10:24:34
47	27	celular	13	1	4700.00	4300.00	0.00	4700.00	2026-02-11 10:29:35	2026-02-11 10:29:35
48	28	producto_general	167	1	40.00	11.00	0.00	40.00	2026-02-11 11:02:07	2026-02-11 11:02:07
49	28	producto_general	448	1	60.00	20.00	0.00	60.00	2026-02-11 11:02:07	2026-02-11 11:02:07
50	29	computadora	12	1	6200.00	5600.00	0.00	6200.00	2026-02-13 23:31:17	2026-02-13 23:31:17
51	30	producto_general	397	1	190.00	45.00	0.00	190.00	2026-02-13 23:34:32	2026-02-13 23:34:32
52	31	celular	7	1	3900.00	3100.00	0.00	3900.00	2026-02-13 23:50:25	2026-02-13 23:50:25
53	31	producto_general	595	1	100.00	20.00	0.00	100.00	2026-02-13 23:50:25	2026-02-13 23:50:25
54	31	producto_general	422	1	190.00	54.00	20.00	170.00	2026-02-13 23:50:25	2026-02-13 23:50:25
55	32	producto_general	179	1	40.00	11.00	0.00	40.00	2026-02-13 23:53:20	2026-02-13 23:53:20
56	32	producto_general	596	1	70.00	20.00	0.00	70.00	2026-02-13 23:53:20	2026-02-13 23:53:20
57	33	producto_general	419	1	400.00	200.00	20.00	380.00	2026-02-13 23:55:09	2026-02-13 23:55:09
58	33	producto_general	589	1	100.00	40.00	0.00	100.00	2026-02-13 23:55:09	2026-02-13 23:55:09
59	33	producto_general	208	1	40.00	11.00	0.00	40.00	2026-02-13 23:55:09	2026-02-13 23:55:09
60	34	producto_apple	14	1	2106.80	1666.80	0.00	2106.80	2026-02-14 00:08:32	2026-02-14 00:08:32
61	34	producto_apple	12	1	4625.80	3889.20	0.00	4625.80	2026-02-14 00:08:32	2026-02-14 00:08:32
62	34	producto_apple	13	1	1282.40	1018.60	0.00	1282.40	2026-02-14 00:08:32	2026-02-14 00:08:32
63	35	celular	37	1	8450.00	7871.00	0.00	8450.00	2026-02-14 00:13:38	2026-02-14 00:13:38
64	35	producto_general	464	1	100.00	40.00	40.00	60.00	2026-02-14 00:13:38	2026-02-14 00:13:38
65	35	producto_general	168	1	40.00	11.00	0.00	40.00	2026-02-14 00:13:38	2026-02-14 00:13:38
66	36	producto_apple	16	1	3600.00	3181.36	0.00	3600.00	2026-02-14 00:20:43	2026-02-14 00:20:43
67	37	producto_general	597	1	900.00	756.00	0.00	900.00	2026-02-14 00:24:01	2026-02-14 00:24:01
68	38	producto_general	598	1	750.00	500.00	0.00	750.00	2026-02-14 00:25:12	2026-02-14 00:25:12
69	39	producto_general	599	1	190.00	120.00	0.00	190.00	2026-02-14 00:26:50	2026-02-14 00:26:50
70	39	producto_general	600	1	190.00	120.00	0.00	190.00	2026-02-14 00:26:50	2026-02-14 00:26:50
71	40	producto_general	391	1	190.00	45.00	0.00	190.00	2026-02-14 21:40:56	2026-02-14 21:40:56
72	40	producto_general	405	1	130.00	45.00	0.00	130.00	2026-02-14 21:40:56	2026-02-14 21:40:56
73	41	producto_apple	7	1	11900.00	10720.00	0.00	11900.00	2026-02-14 21:42:16	2026-02-14 21:42:16
74	42	celular	38	1	13800.00	12857.50	0.00	13800.00	2026-02-14 21:58:24	2026-02-14 21:58:24
75	42	producto_general	207	1	40.00	11.00	0.00	40.00	2026-02-14 21:58:24	2026-02-14 21:58:24
76	42	producto_general	867	1	60.00	20.00	0.00	60.00	2026-02-14 21:58:24	2026-02-14 21:58:24
77	43	celular	39	1	9400.00	8232.50	0.00	9400.00	2026-02-14 22:04:45	2026-02-14 22:04:45
78	43	producto_general	868	1	60.00	20.00	0.00	60.00	2026-02-14 22:04:45	2026-02-14 22:04:45
79	43	producto_general	199	1	40.00	11.00	0.00	40.00	2026-02-14 22:04:45	2026-02-14 22:04:45
80	43	producto_general	398	1	190.00	45.00	20.00	170.00	2026-02-14 22:04:45	2026-02-14 22:04:45
81	44	producto_general	399	1	190.00	45.00	30.00	160.00	2026-02-14 22:08:30	2026-02-14 22:08:30
82	44	producto_general	413	1	130.00	45.00	0.00	130.00	2026-02-14 22:08:30	2026-02-14 22:08:30
83	45	celular	40	1	7300.00	6475.00	0.00	7300.00	2026-02-14 22:15:54	2026-02-14 22:15:54
84	45	producto_general	173	1	40.00	11.00	0.00	40.00	2026-02-14 22:15:54	2026-02-14 22:15:54
85	45	producto_general	869	1	60.00	20.00	0.00	60.00	2026-02-14 22:15:54	2026-02-14 22:15:54
86	45	producto_general	392	1	190.00	45.00	0.00	190.00	2026-02-14 22:15:54	2026-02-14 22:15:54
87	46	celular	6	1	2900.00	2000.00	0.00	2900.00	2026-02-14 22:18:46	2026-02-14 22:18:46
88	46	producto_general	393	1	190.00	45.00	0.00	190.00	2026-02-14 22:18:46	2026-02-14 22:18:46
89	46	producto_general	402	1	130.00	45.00	20.00	110.00	2026-02-14 22:18:46	2026-02-14 22:18:46
90	46	producto_general	870	1	60.00	20.00	0.00	60.00	2026-02-14 22:18:46	2026-02-14 22:18:46
91	46	producto_general	80	1	40.00	11.00	0.00	40.00	2026-02-14 22:18:46	2026-02-14 22:18:46
92	47	celular	41	1	6750.00	5920.00	0.00	6750.00	2026-02-15 21:31:24	2026-02-15 21:31:24
93	47	producto_general	71	1	40.00	11.00	0.00	40.00	2026-02-15 21:31:24	2026-02-15 21:31:24
94	47	producto_general	155	1	40.00	11.00	0.00	40.00	2026-02-15 21:31:24	2026-02-15 21:31:24
95	47	producto_general	753	1	60.00	20.00	0.00	60.00	2026-02-15 21:31:24	2026-02-15 21:31:24
96	47	producto_general	377	1	200.00	140.00	30.00	170.00	2026-02-15 21:31:24	2026-02-15 21:31:24
97	47	producto_general	418	1	400.00	200.00	100.00	300.00	2026-02-15 21:31:24	2026-02-15 21:31:24
98	48	producto_general	1403	1	60.00	20.00	0.00	60.00	2026-02-18 22:31:57	2026-02-18 22:31:57
99	48	producto_general	271	1	40.00	20.00	0.00	40.00	2026-02-18 22:31:57	2026-02-18 22:31:57
100	48	producto_general	332	1	60.00	22.00	0.00	60.00	2026-02-18 22:31:57	2026-02-18 22:31:57
101	49	celular	42	1	9620.00	8300.00	0.00	9620.00	2026-02-18 22:45:21	2026-02-18 22:45:21
102	49	producto_general	194	1	40.00	11.00	0.00	40.00	2026-02-18 22:45:21	2026-02-18 22:45:21
103	50	celular	43	1	12500.00	11625.00	0.00	12500.00	2026-02-18 22:49:16	2026-02-18 22:49:16
104	50	producto_general	202	1	40.00	11.00	0.00	40.00	2026-02-18 22:49:16	2026-02-18 22:49:16
105	51	producto_general	439	1	740.00	550.00	0.00	740.00	2026-02-20 13:00:03	2026-02-20 13:00:03
106	52	computadora	13	1	18900.00	16100.00	400.00	18500.00	2026-02-20 13:01:23	2026-02-20 13:01:23
107	53	celular	36	1	4300.00	3164.00	200.00	4100.00	2026-02-20 13:03:07	2026-02-20 13:03:07
108	54	producto_general	209	1	40.00	11.00	0.00	40.00	2026-02-20 13:03:58	2026-02-20 13:03:58
109	55	producto_general	143	1	40.00	11.00	0.00	40.00	2026-02-20 13:04:57	2026-02-20 13:04:57
110	55	producto_general	1180	1	70.00	35.00	0.00	70.00	2026-02-20 13:04:57	2026-02-20 13:04:57
111	56	celular	35	1	4300.00	3164.00	200.00	4100.00	2026-02-20 17:24:00	2026-02-20 17:24:00
112	57	producto_general	406	1	130.00	45.00	0.00	130.00	2026-02-20 20:15:38	2026-02-20 20:15:38
113	57	producto_general	395	1	190.00	45.00	0.00	190.00	2026-02-20 20:15:38	2026-02-20 20:15:38
114	58	producto_general	139	1	40.00	11.00	0.00	40.00	2026-02-20 20:17:07	2026-02-20 20:17:07
115	58	producto_general	1088	1	70.00	35.00	0.00	70.00	2026-02-20 20:17:07	2026-02-20 20:17:07
116	58	producto_general	588	1	100.00	40.00	0.00	100.00	2026-02-20 20:17:07	2026-02-20 20:17:07
117	58	producto_general	182	1	40.00	11.00	0.00	40.00	2026-02-20 20:17:07	2026-02-20 20:17:07
118	58	producto_general	991	1	70.00	30.00	0.00	70.00	2026-02-20 20:17:07	2026-02-20 20:17:07
119	58	producto_general	105	1	40.00	11.00	0.00	40.00	2026-02-20 20:17:07	2026-02-20 20:17:07
120	59	celular	46	1	13400.00	13100.00	0.00	13400.00	2026-02-23 10:07:03	2026-02-23 10:07:03
121	59	producto_general	415	1	400.00	200.00	0.00	400.00	2026-02-23 10:07:03	2026-02-23 10:07:03
122	60	producto_general	407	1	130.00	45.00	0.00	130.00	2026-02-23 10:13:38	2026-02-23 10:13:38
123	61	celular	45	1	7900.00	7100.00	100.00	7800.00	2026-02-23 10:15:53	2026-02-23 10:15:53
124	61	producto_general	795	1	60.00	20.00	0.00	60.00	2026-02-23 10:15:53	2026-02-23 10:15:53
125	61	producto_general	161	1	40.00	11.00	0.00	40.00	2026-02-23 10:15:53	2026-02-23 10:15:53
126	62	producto_general	462	1	100.00	40.00	0.00	100.00	2026-02-23 10:17:04	2026-02-23 10:17:04
127	63	celular	14	1	1700.00	1200.00	200.00	1500.00	2026-02-23 19:35:51	2026-02-23 19:35:51
128	63	producto_general	435	1	150.00	41.00	0.00	150.00	2026-02-23 19:35:51	2026-02-23 19:35:51
129	63	producto_general	432	1	100.00	35.00	0.00	100.00	2026-02-23 19:35:51	2026-02-23 19:35:51
130	64	producto_general	425	1	190.00	54.00	10.00	180.00	2026-02-23 19:36:45	2026-02-23 19:36:45
131	65	producto_general	417	1	400.00	200.00	50.00	350.00	2026-02-23 19:39:58	2026-02-23 19:39:58
132	65	producto_general	416	1	400.00	200.00	50.00	350.00	2026-02-23 19:39:58	2026-02-23 19:39:58
133	65	producto_general	328	1	75.00	22.00	0.00	75.00	2026-02-23 19:39:58	2026-02-23 19:39:58
134	66	producto_general	344	1	60.00	25.00	0.00	60.00	2026-02-24 19:56:13	2026-02-24 19:56:13
135	66	producto_general	146	1	40.00	11.00	0.00	40.00	2026-02-24 19:56:13	2026-02-24 19:56:13
136	67	celular	31	1	7500.00	7100.00	0.00	7500.00	2026-02-24 19:57:22	2026-02-24 19:57:22
137	67	producto_general	457	1	100.00	40.00	0.00	100.00	2026-02-24 19:57:22	2026-02-24 19:57:22
138	68	producto_general	706	1	60.00	20.00	0.00	60.00	2026-02-24 19:58:48	2026-02-24 19:58:48
139	68	producto_general	91	1	40.00	11.00	0.00	40.00	2026-02-24 19:58:48	2026-02-24 19:58:48
140	69	celular	33	1	9500.00	8800.00	0.00	9500.00	2026-02-24 20:00:01	2026-02-24 20:00:01
141	69	producto_general	184	1	40.00	11.00	0.00	40.00	2026-02-24 20:00:01	2026-02-24 20:00:01
142	70	producto_general	162	1	40.00	11.00	0.00	40.00	2026-02-24 20:00:22	2026-02-24 20:00:22
143	71	producto_general	116	1	40.00	11.00	0.00	40.00	2026-02-26 19:26:43	2026-02-26 19:26:43
144	72	computadora	11	1	7500.00	5225.50	300.00	7200.00	2026-02-26 19:28:19	2026-02-26 19:28:19
145	73	producto_general	859	1	60.00	20.00	0.00	60.00	2026-03-09 09:36:29	2026-03-09 09:36:29
146	73	producto_general	213	1	40.00	11.00	0.00	40.00	2026-03-09 09:36:29	2026-03-09 09:36:29
147	74	producto_general	826	1	60.00	20.00	0.00	60.00	2026-03-09 09:37:27	2026-03-09 09:37:27
148	74	producto_general	185	1	40.00	11.00	0.00	40.00	2026-03-09 09:37:27	2026-03-09 09:37:27
149	74	producto_general	675	1	60.00	20.00	0.00	60.00	2026-03-09 09:37:27	2026-03-09 09:37:27
150	75	producto_general	749	1	60.00	20.00	0.00	60.00	2026-03-09 09:38:07	2026-03-09 09:38:07
151	76	producto_general	1449	1	6500.00	5698.00	0.00	6500.00	2026-03-09 10:05:51	2026-03-09 10:05:51
152	77	celular	44	1	5300.00	4500.00	0.00	5300.00	2026-03-09 10:08:26	2026-03-09 10:08:26
153	77	producto_general	151	1	40.00	11.00	0.00	40.00	2026-03-09 10:08:26	2026-03-09 10:08:26
154	78	producto_general	744	1	60.00	20.00	0.00	60.00	2026-03-09 10:46:27	2026-03-09 10:46:27
155	78	producto_general	135	1	40.00	11.00	0.00	40.00	2026-03-09 10:46:27	2026-03-09 10:46:27
156	79	celular	47	1	13900.00	12123.00	0.00	13900.00	2026-03-09 11:29:57	2026-03-09 11:29:57
157	80	celular	48	1	13200.00	12123.00	0.00	13200.00	2026-03-09 11:31:55	2026-03-09 11:31:55
158	80	celular	49	1	13200.00	12123.00	0.00	13200.00	2026-03-09 11:31:55	2026-03-09 11:31:55
165	82	celular	52	1	5500.00	7075.00	0.00	5500.00	2026-03-09 19:26:09	2026-03-09 19:26:09
166	82	producto_general	506	1	100.00	40.00	10.00	90.00	2026-03-09 19:26:09	2026-03-09 19:26:09
167	82	producto_general	144	1	40.00	11.00	0.00	40.00	2026-03-09 19:26:09	2026-03-09 19:26:09
168	82	producto_general	400	1	190.00	45.00	0.00	190.00	2026-03-09 19:26:09	2026-03-09 19:26:09
169	82	producto_general	424	1	190.00	54.00	90.00	100.00	2026-03-09 19:26:09	2026-03-09 19:26:09
170	82	producto_general	403	1	130.00	45.00	30.00	100.00	2026-03-09 19:26:09	2026-03-09 19:26:09
171	83	producto_general	501	1	100.00	40.00	0.00	100.00	2026-03-09 19:26:48	2026-03-09 19:26:48
172	83	producto_general	152	1	40.00	11.00	0.00	40.00	2026-03-09 19:26:48	2026-03-09 19:26:48
173	84	producto_general	853	1	60.00	20.00	0.00	60.00	2026-03-09 19:28:49	2026-03-09 19:28:49
174	84	producto_general	203	1	40.00	11.00	0.00	40.00	2026-03-09 19:28:49	2026-03-09 19:28:49
175	85	producto_general	164	1	40.00	11.00	0.00	40.00	2026-03-09 19:29:28	2026-03-09 19:29:28
176	85	producto_general	414	1	130.00	45.00	0.00	130.00	2026-03-09 19:29:28	2026-03-09 19:29:28
177	86	celular	53	1	13200.00	12123.00	0.00	13200.00	2026-03-09 19:39:18	2026-03-09 19:39:18
178	86	producto_general	865	1	60.00	20.00	0.00	60.00	2026-03-09 19:39:18	2026-03-09 19:39:18
179	86	producto_general	863	1	60.00	20.00	0.00	60.00	2026-03-09 19:39:18	2026-03-09 19:39:18
180	86	producto_general	214	1	40.00	11.00	0.00	40.00	2026-03-09 19:39:18	2026-03-09 19:39:18
181	87	producto_general	434	1	100.00	35.00	0.00	100.00	2026-03-09 19:39:58	2026-03-09 19:39:58
182	87	producto_general	56	1	40.00	11.00	0.00	40.00	2026-03-09 19:39:58	2026-03-09 19:39:58
183	88	celular	11	1	3500.00	2739.00	0.00	3500.00	2026-03-09 19:41:34	2026-03-09 19:41:34
184	88	producto_general	20	1	40.00	11.00	0.00	40.00	2026-03-09 19:41:34	2026-03-09 19:41:34
185	89	producto_general	1138	1	100.00	35.00	0.00	100.00	2026-03-09 19:43:49	2026-03-09 19:43:49
186	89	producto_general	73	1	40.00	11.00	0.00	40.00	2026-03-09 19:43:49	2026-03-09 19:43:49
187	90	celular	54	1	2200.00	1000.00	0.00	2200.00	2026-03-09 19:47:31	2026-03-09 19:47:31
188	90	producto_general	1234	1	60.00	20.00	10.00	50.00	2026-03-09 19:47:31	2026-03-09 19:47:31
189	91	celular	51	1	13700.00	13790.00	0.00	13700.00	2026-03-09 19:51:40	2026-03-09 19:51:40
190	91	producto_general	1446	1	150.00	40.00	0.00	150.00	2026-03-09 19:51:40	2026-03-09 19:51:40
191	92	celular	30	1	7900.00	10375.00	500.00	7400.00	2026-03-09 19:59:18	2026-03-09 19:59:18
192	92	producto_general	426	1	190.00	54.00	30.00	160.00	2026-03-09 19:59:18	2026-03-09 19:59:18
193	92	producto_general	160	1	40.00	11.00	0.00	40.00	2026-03-09 19:59:18	2026-03-09 19:59:18
194	92	producto_general	442	1	600.00	551.00	100.00	500.00	2026-03-09 19:59:18	2026-03-09 19:59:18
195	93	celular	28	1	7200.00	8700.00	400.00	6800.00	2026-03-09 20:00:24	2026-03-09 20:00:24
196	93	producto_general	1147	1	70.00	35.00	10.00	60.00	2026-03-09 20:00:24	2026-03-09 20:00:24
197	93	producto_general	147	1	40.00	11.00	0.00	40.00	2026-03-09 20:00:24	2026-03-09 20:00:24
198	94	celular	50	1	13550.00	12123.00	150.00	13400.00	2026-03-09 20:01:36	2026-03-09 20:01:36
199	95	producto_general	633	1	60.00	20.00	0.00	60.00	2026-03-09 20:02:11	2026-03-09 20:02:11
200	96	celular	55	1	9300.00	6624.00	0.00	9300.00	2026-03-10 09:23:57	2026-03-10 09:23:57
201	96	producto_general	196	1	40.00	11.00	0.00	40.00	2026-03-10 09:23:57	2026-03-10 09:23:57
202	96	producto_general	836	1	60.00	20.00	0.00	60.00	2026-03-10 09:23:57	2026-03-10 09:23:57
203	96	producto_general	181	1	40.00	11.00	0.00	40.00	2026-03-10 09:23:57	2026-03-10 09:23:57
204	97	computadora	14	1	17100.00	17025.00	0.00	17100.00	2026-03-10 19:05:09	2026-03-10 19:05:09
205	98	producto_general	1458	1	200.00	60.00	0.00	200.00	2026-03-10 19:08:52	2026-03-10 19:08:52
206	98	producto_general	423	1	190.00	54.00	0.00	190.00	2026-03-10 19:08:52	2026-03-10 19:08:52
207	99	producto_general	183	1	40.00	11.00	0.00	40.00	2026-03-10 19:09:16	2026-03-10 19:09:16
208	100	computadora	15	1	7450.00	7047.50	0.00	7450.00	2026-03-12 19:30:53	2026-03-12 19:30:53
209	101	producto_general	1525	1	780.00	650.00	0.00	780.00	2026-03-13 19:20:06	2026-03-13 19:20:06
210	102	producto_general	1498	1	40.00	4.95	0.00	40.00	2026-03-13 19:20:55	2026-03-13 19:20:55
211	103	producto_apple	8	1	7000.00	6900.00	150.00	6850.00	2026-03-13 19:23:22	2026-03-13 19:23:22
212	104	celular	16	1	3000.00	2000.00	100.00	2900.00	2026-03-16 19:43:01	2026-03-16 19:43:01
213	104	producto_general	7	1	40.00	10.00	0.00	40.00	2026-03-16 19:43:01	2026-03-16 19:43:01
214	105	producto_general	1523	1	170.00	35.00	0.00	170.00	2026-03-16 19:44:44	2026-03-16 19:44:44
215	106	producto_general	1526	1	540.00	493.00	0.00	540.00	2026-03-16 19:46:33	2026-03-16 19:46:33
216	107	celular	5	1	3000.00	2500.00	700.00	2300.00	2026-03-16 19:47:28	2026-03-16 19:47:28
217	108	celular	56	1	9500.00	8370.00	0.00	9500.00	2026-03-17 09:51:58	2026-03-17 09:51:58
218	108	producto_general	191	1	40.00	11.00	0.00	40.00	2026-03-17 09:51:58	2026-03-17 09:51:58
219	108	producto_general	1450	1	190.00	60.00	0.00	190.00	2026-03-17 09:51:58	2026-03-17 09:51:58
220	109	producto_general	1451	1	230.00	60.00	0.00	230.00	2026-03-17 19:09:31	2026-03-17 19:09:31
221	109	producto_general	404	1	160.00	45.00	0.00	160.00	2026-03-17 19:09:31	2026-03-17 19:09:31
222	110	producto_general	1527	1	535.00	551.00	0.00	535.00	2026-03-17 19:10:10	2026-03-17 19:10:10
223	111	producto_general	1497	1	60.00	20.00	10.00	50.00	2026-03-17 19:11:08	2026-03-17 19:11:08
224	112	producto_general	204	1	40.00	11.00	0.00	40.00	2026-03-17 19:12:06	2026-03-17 19:12:06
225	113	producto_general	1452	1	190.00	60.00	0.00	190.00	2026-03-17 19:13:17	2026-03-17 19:13:17
226	113	producto_general	412	1	130.00	45.00	0.00	130.00	2026-03-17 19:13:17	2026-03-17 19:13:17
227	114	producto_general	1528	1	540.00	493.00	0.00	540.00	2026-03-17 19:15:29	2026-03-17 19:15:29
228	115	producto_general	410	1	130.00	45.00	0.00	130.00	2026-03-19 09:40:26	2026-03-19 09:40:26
229	116	producto_general	429	1	100.00	35.00	0.00	100.00	2026-03-19 09:40:57	2026-03-19 09:40:57
230	117	producto_general	376	1	200.00	140.00	0.00	200.00	2026-03-19 09:49:00	2026-03-19 09:49:00
231	118	computadora	4	1	9500.00	8390.00	0.00	9500.00	2026-03-20 11:37:07	2026-03-20 11:37:07
232	119	celular	57	1	7150.00	5985.00	0.00	7150.00	2026-03-20 13:11:11	2026-03-20 13:11:11
233	119	producto_general	378	1	200.00	140.00	50.00	150.00	2026-03-20 13:11:11	2026-03-20 13:11:11
234	119	producto_general	1460	1	190.00	60.00	40.00	150.00	2026-03-20 13:11:11	2026-03-20 13:11:11
235	119	producto_general	153	1	40.00	11.00	40.00	0.00	2026-03-20 13:11:11	2026-03-20 13:11:11
236	119	producto_general	754	1	60.00	20.00	60.00	0.00	2026-03-20 13:11:11	2026-03-20 13:11:11
237	120	producto_general	428	1	100.00	35.00	0.00	100.00	2026-03-23 09:34:58	2026-03-23 09:34:58
238	120	producto_general	123	1	40.00	11.00	0.00	40.00	2026-03-23 09:34:58	2026-03-23 09:34:58
239	121	producto_general	356	1	480.00	368.00	100.00	380.00	2026-03-23 09:35:51	2026-03-23 09:35:51
240	121	producto_general	433	1	100.00	35.00	0.00	100.00	2026-03-23 09:35:51	2026-03-23 09:35:51
241	121	producto_general	1478	1	130.00	30.00	0.00	130.00	2026-03-23 09:35:51	2026-03-23 09:35:51
242	122	producto_general	430	1	100.00	35.00	0.00	100.00	2026-03-23 09:43:09	2026-03-23 09:43:09
243	122	producto_general	1477	1	130.00	30.00	10.00	120.00	2026-03-23 09:43:09	2026-03-23 09:43:09
244	122	producto_general	1529	1	190.00	60.00	10.00	180.00	2026-03-23 09:43:09	2026-03-23 09:43:09
245	123	producto_general	128	1	40.00	11.00	0.00	40.00	2026-03-24 09:30:34	2026-03-24 09:30:34
246	124	producto_general	177	1	40.00	11.00	0.00	40.00	2026-03-24 19:38:26	2026-03-24 19:38:26
247	124	producto_general	829	1	60.00	20.00	0.00	60.00	2026-03-24 19:38:26	2026-03-24 19:38:26
248	125	celular	25	1	4900.00	3700.00	300.00	4600.00	2026-03-27 10:21:16	2026-03-27 10:21:16
249	126	producto_apple	17	1	250.00	180.00	0.00	250.00	2026-03-27 10:31:55	2026-03-27 10:31:55
250	127	producto_general	113	1	40.00	11.00	0.00	40.00	2026-03-27 10:33:48	2026-03-27 10:33:48
251	128	producto_general	1488	1	200.00	50.00	0.00	200.00	2026-03-27 10:34:08	2026-03-27 10:34:08
252	129	producto_general	357	1	480.00	368.00	100.00	380.00	2026-03-27 10:34:57	2026-03-27 10:34:57
253	130	celular	60	1	6400.00	5498.58	0.00	6400.00	2026-03-31 16:27:22	2026-03-31 16:27:22
254	131	producto_general	1530	1	300.00	191.50	20.00	280.00	2026-03-31 16:48:01	2026-03-31 16:48:01
255	131	producto_general	1531	1	300.00	191.50	20.00	280.00	2026-03-31 16:48:01	2026-03-31 16:48:01
256	132	producto_general	1534	1	5000.00	4788.90	0.00	5000.00	2026-03-31 16:57:12	2026-03-31 16:57:12
257	133	celular	61	1	6500.00	5052.00	0.00	6500.00	2026-03-31 17:12:08	2026-03-31 17:12:08
258	133	producto_general	907	1	70.00	35.00	20.00	50.00	2026-03-31 17:12:08	2026-03-31 17:12:08
259	133	producto_general	1102	1	70.00	35.00	20.00	50.00	2026-03-31 17:12:08	2026-03-31 17:12:08
260	133	producto_general	136	1	40.00	11.00	0.00	40.00	2026-03-31 17:12:08	2026-03-31 17:12:08
261	134	producto_general	106	1	40.00	11.00	0.00	40.00	2026-03-31 17:12:46	2026-03-31 17:12:46
262	135	producto_general	1521	1	40.00	4.95	0.00	40.00	2026-03-31 17:16:03	2026-03-31 17:16:03
263	135	producto_general	832	1	60.00	20.00	0.00	60.00	2026-03-31 17:16:03	2026-03-31 17:16:03
264	135	producto_general	1487	1	200.00	50.00	0.00	200.00	2026-03-31 17:16:03	2026-03-31 17:16:03
265	135	producto_general	1532	1	300.00	191.50	0.00	300.00	2026-03-31 17:16:03	2026-03-31 17:16:03
266	136	producto_general	81	1	40.00	11.00	0.00	40.00	2026-03-31 17:20:34	2026-03-31 17:20:34
267	136	producto_general	98	1	40.00	11.00	0.00	40.00	2026-03-31 17:20:34	2026-03-31 17:20:34
268	136	producto_general	111	1	40.00	11.00	0.00	40.00	2026-03-31 17:20:34	2026-03-31 17:20:34
269	136	producto_general	1535	1	60.00	0.00	0.00	60.00	2026-03-31 17:20:34	2026-03-31 17:20:34
270	137	celular	62	1	3000.00	2200.00	0.00	3000.00	2026-03-31 17:26:36	2026-03-31 17:26:36
271	137	producto_general	82	1	40.00	11.00	5.00	35.00	2026-03-31 17:26:36	2026-03-31 17:26:36
272	137	producto_general	102	1	40.00	11.00	5.00	35.00	2026-03-31 17:26:36	2026-03-31 17:26:36
273	138	producto_apple	18	1	5989.00	4834.30	0.00	5989.00	2026-03-31 17:39:55	2026-03-31 17:39:55
274	139	celular	63	1	1900.00	750.00	0.00	1900.00	2026-03-31 17:47:10	2026-03-31 17:47:10
275	140	celular	64	1	5200.00	3990.00	0.00	5200.00	2026-03-31 17:54:24	2026-03-31 17:54:24
276	140	producto_general	121	1	40.00	11.00	0.00	40.00	2026-03-31 17:54:24	2026-03-31 17:54:24
277	141	producto_general	165	1	40.00	11.00	0.00	40.00	2026-03-31 17:54:42	2026-03-31 17:54:42
278	142	computadora	16	1	22900.00	19540.00	0.00	22900.00	2026-03-31 17:57:46	2026-03-31 17:57:46
279	143	producto_general	1533	1	300.00	191.50	10.00	290.00	2026-03-31 18:04:00	2026-03-31 18:04:00
280	144	producto_general	1486	1	200.00	50.00	100.00	100.00	2026-03-31 18:17:04	2026-03-31 18:17:04
281	144	producto_general	1164	1	70.00	35.00	70.00	0.00	2026-03-31 18:17:04	2026-03-31 18:17:04
282	145	producto_general	163	1	40.00	11.00	40.00	0.00	2026-03-31 18:18:24	2026-03-31 18:18:24
283	145	producto_general	791	1	60.00	20.00	60.00	0.00	2026-03-31 18:18:24	2026-03-31 18:18:24
284	145	producto_general	1216	1	70.00	35.00	0.00	70.00	2026-03-31 18:18:24	2026-03-31 18:18:24
285	146	celular	65	1	7300.00	5866.00	0.00	7300.00	2026-03-31 18:46:18	2026-03-31 18:46:18
286	147	computadora	17	1	7950.00	7162.00	0.00	7950.00	2026-03-31 19:24:22	2026-03-31 19:24:22
287	148	producto_general	1536	1	390.00	367.70	0.00	390.00	2026-03-31 19:25:43	2026-03-31 19:25:43
\.


--
-- Name: automation_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.automation_reports_id_seq', 1, false);


--
-- Name: celulares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.celulares_id_seq', 78, true);


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.clientes_id_seq', 102, true);


--
-- Name: computadoras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.computadoras_id_seq', 17, true);


--
-- Name: cotizaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.cotizaciones_id_seq', 5, true);


--
-- Name: egresos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.egresos_id_seq', 1, false);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.jobs_id_seq', 5, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.migrations_id_seq', 20, true);


--
-- Name: productos_apple_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.productos_apple_id_seq', 18, true);


--
-- Name: productos_generales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.productos_generales_id_seq', 1581, true);


--
-- Name: promociones_enviadas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.promociones_enviadas_id_seq', 1, false);


--
-- Name: secuencias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.secuencias_id_seq', 2, true);


--
-- Name: servicio_tecnicos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.servicio_tecnicos_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: ventas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.ventas_id_seq', 148, true);


--
-- Name: ventas_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: user
--

SELECT pg_catalog.setval('public.ventas_items_id_seq', 287, true);


--
-- Name: automation_reports automation_reports_period_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.automation_reports
    ADD CONSTRAINT automation_reports_period_unique UNIQUE (period);


--
-- Name: automation_reports automation_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.automation_reports
    ADD CONSTRAINT automation_reports_pkey PRIMARY KEY (id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: celulares celulares_imei_1_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.celulares
    ADD CONSTRAINT celulares_imei_1_unique UNIQUE (imei_1);


--
-- Name: celulares celulares_imei_2_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.celulares
    ADD CONSTRAINT celulares_imei_2_unique UNIQUE (imei_2);


--
-- Name: celulares celulares_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.celulares
    ADD CONSTRAINT celulares_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: computadoras computadoras_numero_serie_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.computadoras
    ADD CONSTRAINT computadoras_numero_serie_unique UNIQUE (numero_serie);


--
-- Name: computadoras computadoras_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.computadoras
    ADD CONSTRAINT computadoras_pkey PRIMARY KEY (id);


--
-- Name: cotizaciones cotizaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_pkey PRIMARY KEY (id);


--
-- Name: egresos egresos_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.egresos
    ADD CONSTRAINT egresos_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: productos_apple productos_apple_imei_1_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.productos_apple
    ADD CONSTRAINT productos_apple_imei_1_unique UNIQUE (imei_1);


--
-- Name: productos_apple productos_apple_imei_2_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.productos_apple
    ADD CONSTRAINT productos_apple_imei_2_unique UNIQUE (imei_2);


--
-- Name: productos_apple productos_apple_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.productos_apple
    ADD CONSTRAINT productos_apple_pkey PRIMARY KEY (id);


--
-- Name: productos_generales productos_generales_codigo_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.productos_generales
    ADD CONSTRAINT productos_generales_codigo_unique UNIQUE (codigo);


--
-- Name: productos_generales productos_generales_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.productos_generales
    ADD CONSTRAINT productos_generales_pkey PRIMARY KEY (id);


--
-- Name: promociones_enviadas promociones_enviadas_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.promociones_enviadas
    ADD CONSTRAINT promociones_enviadas_pkey PRIMARY KEY (id);


--
-- Name: secuencias secuencias_clave_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.secuencias
    ADD CONSTRAINT secuencias_clave_unique UNIQUE (clave);


--
-- Name: secuencias secuencias_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.secuencias
    ADD CONSTRAINT secuencias_pkey PRIMARY KEY (id);


--
-- Name: servicio_tecnicos servicio_tecnicos_codigo_nota_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.servicio_tecnicos
    ADD CONSTRAINT servicio_tecnicos_codigo_nota_unique UNIQUE (codigo_nota);


--
-- Name: servicio_tecnicos servicio_tecnicos_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.servicio_tecnicos
    ADD CONSTRAINT servicio_tecnicos_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ventas ventas_codigo_nota_unique; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_codigo_nota_unique UNIQUE (codigo_nota);


--
-- Name: ventas_items ventas_items_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ventas_items
    ADD CONSTRAINT ventas_items_pkey PRIMARY KEY (id);


--
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- Name: cotizaciones_cliente_id_index; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX cotizaciones_cliente_id_index ON public.cotizaciones USING btree (cliente_id);


--
-- Name: cotizaciones_user_id_fecha_cotizacion_index; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX cotizaciones_user_id_fecha_cotizacion_index ON public.cotizaciones USING btree (user_id, fecha_cotizacion);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: user
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: clientes clientes_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cotizaciones cotizaciones_cliente_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_cliente_id_foreign FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;


--
-- Name: cotizaciones cotizaciones_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.cotizaciones
    ADD CONSTRAINT cotizaciones_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: egresos egresos_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.egresos
    ADD CONSTRAINT egresos_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promociones_enviadas promociones_enviadas_cliente_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.promociones_enviadas
    ADD CONSTRAINT promociones_enviadas_cliente_id_foreign FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- Name: servicio_tecnicos servicio_tecnicos_cliente_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.servicio_tecnicos
    ADD CONSTRAINT servicio_tecnicos_cliente_id_foreign FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;


--
-- Name: servicio_tecnicos servicio_tecnicos_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.servicio_tecnicos
    ADD CONSTRAINT servicio_tecnicos_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: servicio_tecnicos servicio_tecnicos_venta_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.servicio_tecnicos
    ADD CONSTRAINT servicio_tecnicos_venta_id_foreign FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON DELETE SET NULL;


--
-- Name: ventas_items ventas_items_venta_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ventas_items
    ADD CONSTRAINT ventas_items_venta_id_foreign FOREIGN KEY (venta_id) REFERENCES public.ventas(id) ON DELETE CASCADE;


--
-- Name: ventas ventas_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict 1SA1bHr6sjBQsOsROV0jHHNUIWTGilzpEkSYNs9snnYXnUFNjJ8kcnQyKL2LPTr

