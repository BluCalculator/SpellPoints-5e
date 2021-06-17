const myGreen="#08c70e";
const myRed="#db4540";
var max;
var points;
var level;
var profession;
var recovery;
var settings = {settings_visible:false	//0=settings visble
				,toggle_settings_visible: function() {this.settings_visible=!this.settings_visible;updateGUI();save();}
				,homebrew_visible:false	//1=homebrew visible
				,toggle_homebrew_visible: function() { this.homebrew_visible=!this.homebrew_visible;updateGUI();save();}
				,recover_points:false	//2=arcane recovery uses points instead of slots
				,toggle_recover_points: function() { this.recover_points=!this.recover_points;updateGUI();save();}
				,spellbook:false	//3=use spellbook instead of generic
				,toggle_spellbook: function() { this.spellbook=!this.spellbook;updateGUI();save();}
				,free_high_levels:false	//4=high level spells can be used as long as you have points
				,toggle_free_high_levels: function() { this.free_high_levels=!this.free_high_levels;updateGUI();save();}
				,colorblind:false	//5=colourblind mode - use enabled/disabled text rather than colour of button
				,toggle_colorblind: function() { this.colorblind=!this.colorblind;updateGUI();save();}
				};
var hightierused = [false,false,false,false];
var mpPerLevel = [4,6,14,17,27,32,38,44,57,64,73,73,83,83,94,94,107,114,123,133];
var costPerLevel = [2,3,5,6,7,9,10,11,13];
var spells = JSON.parse(spellsString);
var mp;
var cookies = false;
var spent = [];
var recovered = [];
var tentatively_recovered = [];
var recover_levels;
function load() {
	level = document.getElementById("primarylevel");
	points = document.getElementById("points");
	max = document.getElementById("max");
	recovery = document.getElementById("arcane");
	profession = document.getElementById("profession");
	
	if (localStorage.getItem("primarylevel")==null) {
		cookies=confirm("This tool works best with cookies! Would you like a cookie?");
		mp=0;
	} else {
		cookies=true;
		mp=parseInt(localStorage.getItem("mana"));
		level.selectedIndex=localStorage.getItem("primarylevel");
		hightierused=JSON.parse(localStorage.getItem("hightierused"));
		spent=JSON.parse(localStorage.getItem("spent"));
		recovered=JSON.parse(localStorage.getItem("recovered"));
		recovery.disable=JSON.parse(localStorage.getItem("recoverydisabled"));
		
		settings.recover_points=JSON.parse(localStorage.getItem("recover_points"));
		settings.spellbook=JSON.parse(localStorage.getItem("spellbook"));
		settings.free_high_levels=JSON.parse(localStorage.getItem("free_high_levels"));
		settings.colorblind=JSON.parse(localStorage.getItem("colorblind"));
		
	}
	/*for (let i=0;i<spells.length;i++){
		if (spells[i].level!="cantrip") {
			let section=document.getElementById("slots"+spells[i].level).innerHTML;
			document.getElementById("slots"+spells[i].level).innerHTML =				section
				+"<button onclick=\"spell("
				+spells[i].level
				+")\">"+spells[i].name+"</button>";
		}
	}*/
	
	let buttons="";
	for (let i=0;i<spent.length;i++) {
		let lvl=spent[i];
		buttons+="<button onclick=\"recover("+i+")\" id=\"spent"+i+"\" data-lvl=\""+lvl+"\">Generic Level "+lvl+" Spell</button>"
	}
	document.getElementById("spent").innerHTML=buttons;
	
	
	updateLevel();
	updateGUI();
}
function save() {
	if (cookies) {
		localStorage.setItem("mana",mp);
		localStorage.setItem("primarylevel", level.selectedIndex);
		localStorage.setItem("recoverydisabled", recovery.disabled);
		localStorage.setItem("hightierused", JSON.stringify(hightierused));
		localStorage.setItem("spent", JSON.stringify(spent));
		localStorage.setItem("recovered", JSON.stringify(recovered));
		localStorage.setItem("recover_points", JSON.stringify(settings.recover_points));
		localStorage.setItem("spellbook", JSON.stringify(settings.spellbook));
		localStorage.setItem("free_high_levels", JSON.stringify(settings.free_high_levels));
		localStorage.setItem("colorblind", JSON.stringify(settings.colorblind));
	}
	console.log("saved "+mp+" mp, lvl "+level.selectedIndex+", recoveryused="+recovery.disabled);
}
function reset() {
	//TODO: "are you sure?"
	    localStorage.clear();
		location.reload();
}
function longrest() {
	mp=mpPerLevel[level.selectedIndex];
	points.innerHTML=mp;
	recovery.disabled=false;
	hightierused=[false,false,false,false];
	spent=[];
	document.getElementById("spent").innerHTML="";
	recovered=[];
	document.getElementById("recovered").innerHTML="";
	tentatively_recovered=[];
	document.getElementById("tentatively_recovered").innerHTML="";
	updateGUI();
	save();
}
function shortrest() {
	if (settings.recover_points) {
		mp+=costPerLevel[spellLevelOf(level.selectedIndex+1)-1];
		if (mp>mpPerLevel[level.selectedIndex]) {
			mp=mpPerLevel[level.selectedIndex];
		}
		recovery.disabled=true;
	} else {
		recover_levels=level.selectedIndex+1;
		tentatively_recovered=[];
		document.styleSheets[0].rules[2].style.display="block";
	}
	updateGUI();
	save();
}
function recover(id) {
	let button=document.getElementById("spent"+id);
	let level=parseInt(button.getAttribute("data-lvl"));
	if (recover_levels>=level) {
		recover_levels-=level;
		tentatively_recovered.push(level);
		console.log("recovering from button "+id);
		button.disabled=true;
		let buttons=document.getElementById("spent").children;
		for (let i=0;i<buttons.length;i++) {
			if (parseInt(buttons[i].getAttribute("data-lvl")) > recover_levels) {
				buttons[i].disabled=true;
			}
		}
	}
	updateGUI();
	save();
}
function closerecovery(exitcode) {
	document.styleSheets[0].rules[2].style.display="none";
	
	if (exitcode==0) {
		document.getElementById("arcane").disabled=true;
		recovered=tentatively_recovered;
	} else {
		//todo work out if there's anything that belongs here
	}
	updateGUI();
	save();
}
function spell(lvl) {
	arraylvl=lvl-1;
	let index=recovered.indexOf(lvl);
	if (index!=-1) {
		recovered.splice(index,1);
	} else if (mp-costPerLevel[arraylvl]<0)
		alert("can't do dat");
	else {
		mp-=costPerLevel[arraylvl];
		if (lvl>5) hightierused[lvl-6]=true;
		document.getElementById("spent").innerHTML+=
			   "<button"
				+" onclick=\"recover("+spent.length+")\""
				+" id=\"spent"+spent.length+"\""
				+" data-lvl=\""+lvl+"\">"
				+"Generic Level "+lvl+" Spell"
				+"</button>";
			  /*<button onclick="recover(0)" id="spent0" data-lvl="3">
					Generic Level 3 Spell
				</button>;*/
		spent.push(lvl);
	}
	updateGUI();
	save();
}
function spellLevelOf(lvl) {
	let r = 0;
	r = Math.floor((lvl+1)/2);
	if (r>9) return 9;
	else return r;
}
function updateClass() {
	let p = profession.item(profession.selectedIndex).text;
	if (p!="---") {
		
	}
/*	if (p=="---") {
		
	} else if (p=="fullcaster"
				|| p=="bard"
				|| p=="cleric"
				|| p=="druid"
				|| p=="sorceror"
				|| p=="wizard") {
		
	} else if (p=="halfcaster"
				|| p=="paladin"
				|| p=="ranger") {
		
	} else if (p=="thirdcaster"
				|| p=="figher_ek"
				|| p=="rogue_at") {
		
	}*/
	updateGUI();
	save();
}
function updateLevel() {
	max.innerHTML=mpPerLevel[level.selectedIndex];
	if (mp>mpPerLevel[level.selectedIndex])
		mp=mpPerLevel[level.selectedIndex];
	updateGUI();
	save();
}
function updateGUI() {
	
	document.getElementById("settings").style.display=settings.settings_visible?"inline-block":"none";
	
	document.getElementById("homebrew").style.display=settings.homebrew_visible?"inline-block":"none";
	
	document.getElementById("arcane_recovery_points").innerHTML=settings.recover_points?"enabled":"disabled";
	document.getElementById("arcane_recovery_points_button").style.backgroundColor=settings.recover_points?myGreen:myRed;
	
	document.getElementById("spellbook_setting").innerHTML=settings.spellbook?"enabled":"disabled";
	document.getElementById("spellbook_setting_button").style.backgroundColor=settings.spellbook?myGreen:myRed;
	
	document.getElementById("free_high_levels").innerHTML=settings.free_high_levels?"enabled":"disabled";
	document.getElementById("free_high_levels_button").style.backgroundColor=settings.free_high_levels?myGreen:myRed;
	
	document.styleSheets[0].rules[0].style.display=settings.colorblind?"inline":"none";
	document.getElementById("colourblind_mode").innerHTML=settings.colorblind?"enabled":"disabled";
	document.getElementById("colourblind_mode_button").style.backgroundColor=settings.colorblind?myGreen:myRed;
	
	
	points.innerHTML=mp;
	for (let i=0;i<9;i++) {
		if (spellLevelOf(level.selectedIndex)<i
				|| mp-costPerLevel[i]<0
				|| (!settings.free_high_levels//homebrew rule: do we care about one-use-per-day
						&& i>4//6th levl spell or higher
						&& hightierused[i-5]))//spell hasn't been used yet
						{
			list=document.getElementById("slots"+(i+1)).children;
			for (let j=0;j<list.length;j++) {
				list[j].disabled=true;
			}
		}
		else {
			list=document.getElementById("slots"+(i+1)).children;
			for (let j=0;j<list.length;j++) {
				list[j].disabled=false;
			}
		}
	}
	
	let buttons="";
	for (let i=0;i<recovered.length;i++) {
		let lvl=recovered[i];
		buttons+="<button disabled=\"true\" style=\"background-color:#00DD00;color:#FFFFFF\">Arcane Recovery regained Level "+lvl+" Spellslot</button>"
	}
	document.getElementById("recovered").innerHTML=buttons;
	
	buttons="";
	for (let i=0;i<tentatively_recovered.length;i++) {
		let lvl=tentatively_recovered[i];
		buttons+="<button disabled=\"true\" style=\"background-color:#00DD00;color:#FFFFFF\">Arcane Recovery regained Level "+lvl+" Spellslot</button>"
	}
	document.getElementById("tentatively_recovered").innerHTML=buttons;
	document.getElementById("recover_levels").innerHTML=recover_levels;
	
}