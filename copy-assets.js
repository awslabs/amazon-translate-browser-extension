const jetpack = require('fs-jetpack');

jetpack.dir('./extension');
jetpack.copy('./src/assets', './extension/assets', { overwrite: true });
