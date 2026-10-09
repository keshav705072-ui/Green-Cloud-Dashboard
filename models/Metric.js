const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
    actionType: {
        type: String,
        required: true,
        enum: ['AUTOSCALE', 'CARBON_SCHEDULING', 'STORAGE_LIFECYCLE', 'CHAOS_TEST']
    },
    statusMessage: {
        type: String,
        required: true
    },
    carbonIntensity: {
        type: Number,
        default: 0
    },
    instances: {
        type: Number,
        default: 1
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Metric', MetricSchema);