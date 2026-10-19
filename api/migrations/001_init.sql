-- Ponte Visual 2.0 — Schema PostgreSQL (gerado dos modelos SQLAlchemy)
-- Canal Comportamental (primário) + Arte (dormente) + Recepção.

CREATE TABLE tb_alerta (
	id SERIAL NOT NULL, 
	regra VARCHAR(200) NOT NULL, 
	gatilho TEXT, 
	status VARCHAR(30) NOT NULL, 
	criado_em TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE tb_analise_ia (
	id SERIAL NOT NULL, 
	periodo_inicio TIMESTAMP WITH TIME ZONE NOT NULL, 
	periodo_fim TIMESTAMP WITH TIME ZONE NOT NULL, 
	tipo VARCHAR(12) NOT NULL, 
	padroes JSON, 
	confianca_0_1 FLOAT, 
	narrativa TEXT, 
	evidencias JSON, 
	criado_em TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE tb_obra (
	id SERIAL NOT NULL, 
	codigo_legivel VARCHAR(40) NOT NULL, 
	data_hora_criacao TIMESTAMP WITH TIME ZONE NOT NULL, 
	tipo_midia VARCHAR(10) NOT NULL, 
	arquivo_uri VARCHAR(500) NOT NULL, 
	hash_imagem VARCHAR(80), 
	foi_enderecada INTEGER NOT NULL, 
	status VARCHAR(24) NOT NULL, 
	criado_em TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (codigo_legivel)
);

CREATE TABLE tb_perfil (
	id SERIAL NOT NULL, 
	nome VARCHAR(120) NOT NULL, 
	papel VARCHAR(20) NOT NULL, 
	tipo VARCHAR(12) NOT NULL, 
	ve_analise_ia BOOLEAN NOT NULL, 
	email VARCHAR(180) NOT NULL, 
	senha_hash VARCHAR(255) NOT NULL, 
	ativo BOOLEAN NOT NULL, 
	criado_em TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (email)
);

CREATE TABLE tb_taxonomia_intencao (
	id SERIAL NOT NULL, 
	rotulo_curto VARCHAR(60) NOT NULL, 
	nome_tecnico VARCHAR(60) NOT NULL, 
	descricao TEXT, 
	PRIMARY KEY (id), 
	UNIQUE (rotulo_curto)
);

CREATE TABLE tb_checkin (
	id SERIAL NOT NULL, 
	id_perfil_anotador INTEGER NOT NULL, 
	timestamp_agendado TIMESTAMP WITH TIME ZONE, 
	timestamp_preenchido TIMESTAMP WITH TIME ZONE, 
	tipo VARCHAR(12) NOT NULL, 
	status VARCHAR(24) NOT NULL, 
	criado_em TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(id_perfil_anotador) REFERENCES tb_perfil (id)
);

CREATE TABLE tb_config_checkins (
	id SERIAL NOT NULL, 
	id_perfil INTEGER NOT NULL, 
	horarios JSON NOT NULL, 
	dias JSON, 
	janela_expiracao_min INTEGER NOT NULL, 
	ativo BOOLEAN NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(id_perfil) REFERENCES tb_perfil (id)
);

CREATE TABLE tb_emissao (
	id SERIAL NOT NULL, 
	id_obra INTEGER NOT NULL, 
	id_anotador INTEGER NOT NULL, 
	estado_sensorial VARCHAR(40) NOT NULL, 
	nivel_agitacao SMALLINT NOT NULL, 
	gatilho_antecedente TEXT, 
	comportamento_pos TEXT, 
	id_intencao_presumida INTEGER, 
	hipotese_livre TEXT, 
	timestamp_hipotese TIMESTAMP WITH TIME ZONE NOT NULL, 
	criado_em TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (id_obra, id_anotador), 
	FOREIGN KEY(id_obra) REFERENCES tb_obra (id), 
	FOREIGN KEY(id_anotador) REFERENCES tb_perfil (id), 
	FOREIGN KEY(id_intencao_presumida) REFERENCES tb_taxonomia_intencao (id)
);

CREATE TABLE tb_evento (
	id SERIAL NOT NULL, 
	id_perfil INTEGER NOT NULL, 
	tipo VARCHAR(16) NOT NULL, 
	inicio TIMESTAMP WITH TIME ZONE NOT NULL, 
	fim TIMESTAMP WITH TIME ZONE, 
	intensidade_1_5 INTEGER NOT NULL, 
	gatilho_percebido TEXT, 
	intervencao_tentada TEXT, 
	resultado VARCHAR(10), 
	criado_em TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(id_perfil) REFERENCES tb_perfil (id)
);

CREATE TABLE tb_recepcao (
	id SERIAL NOT NULL, 
	id_obra INTEGER NOT NULL, 
	id_receptor INTEGER NOT NULL, 
	id_percepcao_intencao INTEGER, 
	sentimento_receptor TEXT, 
	o_que_entendeu TEXT, 
	confianca_1_5 SMALLINT, 
	contexto_recebimento TEXT, 
	timestamp_percepcao TIMESTAMP WITH TIME ZONE NOT NULL, 
	criado_em TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (id_obra, id_receptor), 
	FOREIGN KEY(id_obra) REFERENCES tb_obra (id), 
	FOREIGN KEY(id_receptor) REFERENCES tb_perfil (id), 
	FOREIGN KEY(id_percepcao_intencao) REFERENCES tb_taxonomia_intencao (id)
);

CREATE TABLE tb_midia (
	id SERIAL NOT NULL, 
	tipo VARCHAR(8) NOT NULL, 
	url_storage VARCHAR(500) NOT NULL, 
	id_checkin INTEGER, 
	id_evento INTEGER, 
	duracao_segundos INTEGER, 
	transcricao TEXT, 
	criado_em TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(id_checkin) REFERENCES tb_checkin (id), 
	FOREIGN KEY(id_evento) REFERENCES tb_evento (id)
);

CREATE TABLE tb_relato (
	id SERIAL NOT NULL, 
	id_checkin INTEGER, 
	id_perfil INTEGER NOT NULL, 
	texto TEXT NOT NULL, 
	criado_em TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(id_checkin) REFERENCES tb_checkin (id), 
	FOREIGN KEY(id_perfil) REFERENCES tb_perfil (id)
);

CREATE TABLE tb_sinal_checkin (
	id SERIAL NOT NULL, 
	id_checkin INTEGER NOT NULL, 
	humor VARCHAR(14) NOT NULL, 
	energia_1_5 INTEGER NOT NULL, 
	horas_sono FLOAT, 
	qualidade_sono_1_5 INTEGER, 
	alimentacao VARCHAR(10), 
	medicacao BOOLEAN, 
	medicacao_obs VARCHAR(255), 
	observacao_livre TEXT, 
	PRIMARY KEY (id), 
	UNIQUE (id_checkin), 
	FOREIGN KEY(id_checkin) REFERENCES tb_checkin (id)
);
