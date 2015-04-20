-- award_journals schema
-- last updated: sometime in 2015

CREATE DATABASE IF NOT EXISTS award_journals;
USE award_journals;

CREATE TABLE articles (
    id INT(11) NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) DEFAULT NULL,
    author_name VARCHAR(255) DEFAULT NULL,
    author_email VARCHAR(255) DEFAULT NULL,
    abstract TEXT,
    keywords VARCHAR(255) DEFAULT NULL,
    journal_id INT(11) DEFAULT NULL,
    file_path VARCHAR(255) DEFAULT NULL,
    file_size VARCHAR(50) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'submitted',
    reviewer_notes TEXT,
    reviewed_at DATETIME DEFAULT NULL,
    published_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE journals (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) DEFAULT NULL,
    description TEXT,
    issn VARCHAR(50) DEFAULT NULL,
    created_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

CREATE TABLE users (
    id INT(11) NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) DEFAULT NULL,
    password VARCHAR(255) DEFAULT NULL,
    full_name VARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    role VARCHAR(50) DEFAULT 'author',
    last_login DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- review assignments (no foreign keys, no unique constraints)
CREATE TABLE review_assignments (
    id INT(11) NOT NULL AUTO_INCREMENT,
    article_id INT(11) DEFAULT NULL,
    reviewer_id INT(11) DEFAULT NULL,
    assigned_at DATETIME DEFAULT NULL,
    due_date DATETIME DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- search/browse logs for analytics
CREATE TABLE article_views (
    id INT(11) NOT NULL AUTO_INCREMENT,
    article_id INT(11) DEFAULT NULL,
    ip_address VARCHAR(50) DEFAULT NULL,
    user_agent TEXT,
    viewed_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- INSERT sample journals
INSERT INTO journals (id, name, description, issn, created_at) VALUES
(1, 'Journal of Agricultural Sciences', 'Crop science, soil management and agronomy research', '2517-8382', '2014-01-01 00:00:00'),
(2, 'Journal of Sustainable Farming', 'Sustainable agriculture and innovation in farming systems', '2517-8404', '2014-01-01 00:00:00'),
(3, 'Journal of Food & Biosystems Engineering', 'Food technology, post-harvest engineering and biosystems', '2517-8411', '2014-01-01 00:00:00');
