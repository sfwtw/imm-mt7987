'use strict';
'require view';
'require fs';
'require form';
'require uci';
'require tools.widgets as widgets';

return view.extend({
	load: function () {
		return Promise.all([
			uci.load('fancontrol')
		]);
	},
	render: async function (data) {
		var m, s, o;

		// 定义calculate_speed函数
		function calculate_speed(current_temp, max_temp, min_temp, max_speed, min_speed, curve_type) {
			if (current_temp < min_temp) {
				return 0;
			}
			var ratio = (current_temp - min_temp) / (max_temp - min_temp);
			var adjusted_ratio;
			if (curve_type !== 0) {
				// 使用Sigmoid函数作为平滑曲线模型，调整起点终点之间曲线的平滑曲率
				var k = curve_type;
				var m = 0.5; // 中点
				var s0 = 1 / (1 + Math.exp(k * m)); // sigmoid(0, k, m)
				var s1 = 1 / (1 + Math.exp(-k * (1 - m))); // sigmoid(1, k, m)
				var s_ratio = 1 / (1 + Math.exp(-k * (ratio - m)));
				adjusted_ratio = (s_ratio - s0) / (s1 - s0);
			} else {
				adjusted_ratio = ratio;
			}
			var fan_speed = min_speed + (max_speed - min_speed) * adjusted_ratio;
			if (fan_speed > max_speed) {
				fan_speed = max_speed;
			}
			return Math.round(fan_speed);
		}

		m = new form.Map('fancontrol', _('Fan Control'));
		s = m.section(form.TypedSection, 'fancontrol', _('Settings'));
		s.anonymous = true;

		// 是否启用
		o = s.option(form.Flag, 'enabled', _('Enable'), _('Enable'));
		o.description = '';
		o.rmempty = false;

		o = s.option(form.Value, 'start_speed', _('Initial Speed'), '');
		o.placeholder = '35';

		o = s.option(form.Value, 'max_speed', _('Max Speed'), '');
		o.placeholder = '255';

		o = s.option(form.Value, 'start_temp', _('Start Temperature'), '');
		o.placeholder = '45';

		o = s.option(form.Value, 'monitor_interval', _('Monitor Interval'), '');
		o.placeholder = '5';

		o = s.option(form.Value, 'temp_threshold', _('Temp Threshold'), '');
		o.placeholder = '2';

		o = s.option(form.Value, 'max_temp', _('Max Temperature'), '');
		o.placeholder = '120';
		o.validate = function(section_id, value) {
			var start_temp = parseInt(uci.get('fancontrol', 'settings', 'start_temp')) || 45;
			var max_temp = parseInt(value);
			if (max_temp < start_temp) {
				return _('Max temperature must be greater than or equal to start temperature.');
			}
			if (max_temp > 120) {
				return _('Max temperature must be less than or equal to 120°C.');
			}
			return true;
		};

		// 添加曲线类型参数
		o = s.option(form.Value, 'curve_type', _('Curve Curvature'), '');
		o.placeholder = '0';
		o.validate = function(section_id, value) {
			var num = parseFloat(value);
			if (isNaN(num)) {
				return _('Please enter a valid number.');
			}
			return true;
		};

		// 添加速度映射显示
		o = s.option(form.DummyValue, 'mapping', _('Speed Mapping'), '');
		var start_temp = parseInt(uci.get('fancontrol', 'settings', 'start_temp')) || 45;
		var max_temp = parseInt(uci.get('fancontrol', 'settings', 'max_temp')) || 120;
		var start_speed = parseInt(uci.get('fancontrol', 'settings', 'start_speed')) || 35;
		var max_speed = parseInt(uci.get('fancontrol', 'settings', 'max_speed')) || 255;
		var temp_threshold = parseInt(uci.get('fancontrol', 'settings', 'temp_threshold')) || 2;
		if (isNaN(max_temp)) max_temp = 120;
		if (isNaN(start_temp)) start_temp = 45;
		if (isNaN(start_speed)) start_speed = 35;
		if (isNaN(max_speed)) max_speed = 255;
		if (isNaN(temp_threshold) || temp_threshold <= 0) temp_threshold = 2;
		var temp_div = parseInt(uci.get('fancontrol', 'settings', 'temp_div')) || 1000;
		var thermal_file = uci.get('fancontrol', 'settings', 'thermal_file');
		var current_temp = 0;
		var curve_type = parseFloat(uci.get('fancontrol', 'settings', 'curve_type')) || 0;
		try {
			var temp_raw = parseInt(await fs.read(thermal_file));
			if (temp_div > 0 && temp_raw > 0) {
				current_temp = temp_raw / temp_div;
			}
		} catch (e) {}
		var cols_per_row = 4; // 每行显示5列，自适应数量
		var data = [];
		for (var temp = start_temp; temp <= max_temp; temp += temp_threshold) {
			var speed = calculate_speed(temp, max_temp, start_temp, max_speed, start_speed, curve_type);
			data.push({temp: temp, speed: speed});
		}
		var chartWidth = 420;
		var chartHeight = 220;
		var chart = '<div style="position: relative; z-index: 10; margin-bottom: 10px;"><svg width="' + chartWidth + '" height="' + chartHeight + '" style="border: 1px solid #ccc;">';
		// 绘制轴
		chart += '<line x1="0" y1="' + chartHeight + '" x2="' + chartWidth + '" y2="' + chartHeight + '" stroke="black" stroke-width="1"/>';
		chart += '<line x1="0" y1="0" x2="0" y2="' + chartHeight + '" stroke="black" stroke-width="1"/>';
		// 移除坐标标签，改为在点旁边显示
		// 绘制线
		var points = data.map(function(d) {
			var x = ((d.temp - start_temp) / (max_temp - start_temp)) * chartWidth;
			var y = chartHeight - ((d.speed / max_speed) * chartHeight);
			return x + ',' + y;
		}).join(' ');
		chart += '<polyline points="' + points + '" stroke="blue" stroke-width="2" fill="none"/>';
		// 绘制数据点和标签
		data.forEach(function(d) {
			var x = ((d.temp - start_temp) / (max_temp - start_temp)) * chartWidth;
			var y = chartHeight - ((d.speed / max_speed) * chartHeight);
			chart += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="red"/>';
			// 只为起始、最高和当前温度显示标签
			if (d.temp === start_temp) {
				chart += '<text x="' + (x + 5) + '" y="' + y + '" text-anchor="start" fill="black" font-size="12">' + d.temp + '°C</text>';
			}
		});
		// 标亮当前值
		if (current_temp >= start_temp && current_temp <= max_temp) {
			var currentX = ((current_temp - start_temp) / (max_temp - start_temp)) * chartWidth;
			var currentSpeed = calculate_speed(current_temp, max_temp, start_temp, max_speed, start_speed, curve_type);
			var currentPercentage = currentSpeed > 0 && currentSpeed > 0 ? Math.round((currentSpeed / max_speed) * 100) : 0;
			var currentY = chartHeight - ((currentSpeed / max_speed) * chartHeight);
			chart += '<circle cx="' + currentX + '" cy="' + currentY + '" r="5" fill="red" stroke="black" stroke-width="2"/>';
			chart += '<text x="' + (currentX + 5) + '" y="' + (currentY - 5) + '" text-anchor="start" fill="black" font-size="12">' + Math.round(current_temp) + '°C, ' + currentPercentage + '%</text>';
		}
		chart += '</svg></div>';
		var mapping = chart + '<table style="width: 100%; border-collapse: collapse; table-layout: auto;">';
		var row = '<tr>';
		var count = 0;
		for (var temp = start_temp; temp <= max_temp; temp += temp_threshold) {
			var speed = calculate_speed(temp, max_temp, start_temp, max_speed, start_speed, curve_type);
			var percentage = Math.round((speed / max_speed) * 100);
			var cell_style = 'border: 1px solid #ccc; padding: 4px;';
			if (Math.abs(temp - current_temp) <= temp_threshold / 2) {
				cell_style += ' background-color: yellow; font-weight: bold;';
			}
			var cell = '<td style="' + cell_style + '">' + temp + '°C: ' + percentage + '% (' + speed + ')</td>';
			row += cell;
			count++;
			if (count % cols_per_row === 0) {
				mapping += row + '</tr>';
				row = '<tr>';
			}
		}
		if (count % cols_per_row !== 0) {
			mapping += row + '</tr>';
		}
		mapping += '</table>';
		o.description = mapping;

		// 温度文件和风扇控制文件移到后面
		o = s.option(form.Value, 'thermal_file', _('Thermal File'), '');
		// o.placeholder = '/sys/devices/virtual/thermal/thermal_zone0/temp';

		o = s.option(form.Value, 'fan_file', _('Fan File'), '');
		// o.placeholder = '/sys/devices/virtual/thermal/cooling_device0/cur_state';

		return m.render();
	}
});