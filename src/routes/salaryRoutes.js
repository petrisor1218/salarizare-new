const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const Driver = require('../models/Driver');
const History = require('../models/History');
const SalaryService = require('../services/SalaryService');

// Obține toate salariile cu filtre
router.get('/', async (req, res) => {
    try {
        const filters = {};
        if (req.query.status) filters.status = req.query.status;
        if (req.query.sofer) filters.sofer = req.query.sofer;
        
        // Filtre pentru lună și an
        if (req.query.month && req.query.year) {
            const startDate = new Date(req.query.year, req.query.month - 1, 1);
            const endDate = new Date(req.query.year, req.query.month, 0);
            filters.luna = {
                $gte: startDate,
                $lte: endDate
            };
        }

        // Filter pentru șoferi inactivi
        if (req.query.showInactive === 'false') {
            filters['sofer.activ'] = true;
        }

        const salaries = await Salary.find(filters)
            .populate('sofer', 'nume activ')
            .sort({ luna: -1 });
        res.json(salaries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Procesare automată salarii și diurnă
router.post('/process-automatic', async (req, res) => {
    try {
        console.log('Starting manual trigger of automatic salary processing...');
        await SalaryService.processAutomaticPayments();
        res.json({ message: 'Automatic salary processing completed successfully' });
    } catch (error) {
        console.error('Error in manual salary processing:', error);
        res.status(500).json({ message: error.message });
    }
});

// Calculează diurna pe o perioadă specifică
router.post('/calculate-diurna', async (req, res) => {
    try {
        const { driverId, startDate, endDate } = req.body;
        const driver = await Driver.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: 'Șoferul nu a fost găsit' });
        }

        const diurna = await SalaryService.calculateDiurna(
            driver, 
            new Date(startDate), 
            new Date(endDate)
        );

        res.json({ diurna });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obține salariile unui șofer specific
router.get('/sofer/:soferId', async (req, res) => {
    try {
        const salaries = await Salary.find({ sofer: req.params.soferId })
            .populate('sofer', 'nume')
            .sort({ luna: -1 });
        res.json(salaries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Adaugă un nou salariu
router.post('/', async (req, res) => {
    try {
        const driver = await Driver.findById(req.body.sofer);
        if (!driver) {
            return res.status(404).json({ message: 'Șoferul nu a fost găsit' });
        }

        const salary = new Salary({
            sofer: req.body.sofer,
            luna: new Date(req.body.luna),
            salariuBaza: req.body.salariuBaza,
            zileLucrate: req.body.zileLucrate,
            bonusuri: req.body.bonusuri || [],
            deduceri: req.body.deduceri || [],
            observatii: req.body.observatii,
            status: req.body.status || 'Draft',
            tipPlata: req.body.tipPlata || 'SALARIU'
        });

        // Actualizăm automat diurna din perioadele înregistrate
        if (req.body.tipPlata?.startsWith('DIURNA')) {
            await SalaryService.calculateDiurna(driver, salary.luna, salary.luna);
        } else {
            await salary.actualizeazaDiurna();
        }

        const newSalary = await salary.save();

        // Adaugă în istoric
        await History.logModificare(
            'Salary',
            newSalary._id,
            'Creare',
            [],
            req.user?._id,
            'Salariu nou creat'
        );

        res.status(201).json(newSalary);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Actualizează un salariu
router.patch('/:id', async (req, res) => {
    try {
        const salary = await Salary.findById(req.params.id);
        if (!salary) {
            return res.status(404).json({ message: 'Salariul nu a fost găsit' });
        }

        const modificari = [];
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                modificari.push({
                    camp: key,
                    valoareVeche: salary[key],
                    valoareNoua: req.body[key]
                });
                salary[key] = req.body[key];
            }
        });

        // Dacă se schimbă luna, actualizăm diurna
        if (req.body.luna) {
            if (salary.tipPlata?.startsWith('DIURNA')) {
                const driver = await Driver.findById(salary.sofer);
                await SalaryService.calculateDiurna(driver, new Date(req.body.luna), new Date(req.body.luna));
            } else {
                await salary.actualizeazaDiurna();
            }
        }

        const updatedSalary = await salary.save();

        // Adaugă în istoric
        await History.logModificare(
            'Salary',
            salary._id,
            'Modificare',
            modificari,
            req.user?._id,
            'Actualizare salariu'
        );

        res.json(updatedSalary);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Adaugă bonus
router.post('/:id/bonus', async (req, res) => {
    try {
        const salary = await Salary.findById(req.params.id);
        if (!salary) {
            return res.status(404).json({ message: 'Salariul nu a fost găsit' });
        }

        salary.bonusuri.push({
            tip: req.body.tip,
            suma: req.body.suma,
            descriere: req.body.descriere,
            moneda: req.body.moneda || 'RON'
        });

        const updatedSalary = await salary.save();
        res.json(updatedSalary);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Adaugă deducere
router.post('/:id/deducere', async (req, res) => {
    try {
        const salary = await Salary.findById(req.params.id);
        if (!salary) {
            return res.status(404).json({ message: 'Salariul nu a fost găsit' });
        }

        salary.deduceri.push({
            tip: req.body.tip,
            suma: req.body.suma,
            descriere: req.body.descriere,
            moneda: req.body.moneda || 'RON'
        });

        const updatedSalary = await salary.save();
        res.json(updatedSalary);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Calculează salariul final
router.post('/:id/calculeaza', async (req, res) => {
    try {
        const salary = await Salary.findById(req.params.id);
        if (!salary) {
            return res.status(404).json({ message: 'Salariul nu a fost găsit' });
        }

        if (salary.tipPlata?.startsWith('DIURNA')) {
            const driver = await Driver.findById(salary.sofer);
            await SalaryService.calculateDiurna(driver, salary.luna, salary.luna);
        } else {
            await salary.actualizeazaDiurna();
        }
        
        // Calculăm totalul
        const total = salary.calculeazaTotal();
        
        salary.status = 'Calculat';
        const updatedSalary = await salary.save();

        res.json({
            ...updatedSalary.toJSON(),
            total
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Marchează salariul ca plătit
router.post('/:id/plateste', async (req, res) => {
    try {
        const salary = await Salary.findById(req.params.id);
        if (!salary) {
            return res.status(404).json({ message: 'Salariul nu a fost găsit' });
        }

        if (salary.status !== 'Calculat') {
            return res.status(400).json({ message: 'Salariul trebuie să fie calculat înainte de a fi marcat ca plătit' });
        }

        salary.status = 'Platit';
        salary.dataPlata = new Date();

        const updatedSalary = await salary.save();

        // Adaugă în istoric
        await History.logModificare(
            'Salary',
            salary._id,
            'StatusUpdate',
            [{
                camp: 'status',
                valoareVeche: 'Calculat',
                valoareNoua: 'Platit'
            }],
            req.user?._id,
            'Salariu marcat ca plătit'
        );

        res.json(updatedSalary);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;