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
		mp=JSON.parse(localStorage.getItem("mana"));
		level.selectedIndex=JSON.parse(localStorage.getItem("primarylevel"));
		recovery.disabled=JSON.parse(localStorage.getItem("recoverydisabled"));
		hightierused=JSON.parse(localStorage.getItem("hightierused"));
		
		spent=JSON.parse(localStorage.getItem("spent"));
		for (let i=0;i<spent.length;i++) {
			spent[i].recovering=false;
		}
		recovered=JSON.parse(localStorage.getItem("recovered"));
		
		settings.recover_points=JSON.parse(localStorage.getItem("recover_points"));
		settings.spellbook=JSON.parse(localStorage.getItem("spellbook"));
		settings.free_high_levels=JSON.parse(localStorage.getItem("free_high_levels"));
		settings.colorblind=JSON.parse(localStorage.getItem("colorblind"));
		
	}
	
	/*
	for (let i=0;i<spells.length;i++){
		if (spells[i].level!="cantrip") {
			let section=document.getElementById("slots"+spells[i].level).innerHTML;
			document.getElementById("slots"+spells[i].level).innerHTML =				section
				+"<button onclick=\"spell("
				+spells[i].level
				+")\">"+spells[i].name+"</button>";
		}
	}*/
	
	buttons="";
	for (let i=0;i<spent.length;i++) {
		
		buttons+=buttonSpent(i);
		
	}
	document.getElementById("spent").innerHTML=buttons;
	
	
	updateLevel();
	updateGUI();
}
function save() {
	if (cookies) {
		localStorage.setItem("mana",JSON.stringify(mp));
		localStorage.setItem("primarylevel", JSON.stringify(level.selectedIndex));
		localStorage.setItem("recoverydisabled", JSON.stringify(recovery.disabled));
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
		recover_levels=Math.ceil((level.selectedIndex+1)/2);
		tentatively_recovered=[];
		document.styleSheets[0].rules[2].style.display="block";
		
	}
	updateGUI();
	save();
}
function recover(id) {
	let level=spent[id].level;
	let buttons=document.getElementById("spent").children;
	if (spent[id].recovering) {
		recover_levels+=level;
		buttons[id].className="";
		spent[id].recovering=false;
	} else {
		recover_levels-=level;
		buttons[id].className="recovered";
		spent[id].recovering=true;
		console.log("recovering from button "+id);
	}
	for (let i=0;i<spent.length;i++) {
		if (!spent[i].recovering && spent[i].level > recover_levels) {
			buttons[i].disabled=true;
		} else {
			buttons[i].disabled=false;
		}
	}
	updateGUI();
	save();
}
function unrecover(id) {
	for (let i=0;i<tentatively_recovered.length;i++) {
		
	}
}
function closerecovery(exitcode) {
	document.styleSheets[0].rules[2].style.display="none";
	
	if (exitcode==0) {
		document.getElementById("arcane").disabled=true;
		for (let i=0;i<spent.length;i++) {
			if (spent[i].recovering) recovered.push(spent[i].level);
		}
	} else {
		let dead=document.getElementById("spent").children;
		for (let i=0;i<dead.length;i++) {
			dead[i].disabled=false;
		}
		for (let i=0;i<spent.length;i++) {
			spent[i].recovering=false;
		}
	}
	recovered.sort();
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
		spent.push({level:lvl,recovering:false});
		document.getElementById("spent").innerHTML+=buttonSpent(spent.length-1);
	}
	updateGUI();
	save();
}
function spellLevelOf(lvl) {
	let r = Math.floor((lvl+1)/2);
	if (r>9) return 9;
	else return r;
}
function buttonSpent(id) {
	return "<button onclick=\"recover("+id+")\">Level "+spent[id].level+" Slot</button>";
}
function e(x) {
	console.log(x);
	return x;
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
		let spellLvl=spellLevelOf(level.selectedIndex+1);
		console.log("i="+i);
		if (spellLvl<=i//level is too high for character
				|| (mp-costPerLevel[i]<0//not enough spellpoints
						&& recovered.indexOf(i+1)==-1//no recovered spell slot
						)
				|| (!settings.free_high_levels//homebrew rule: do we care about one-use-per-day
						&& i>4//6th level spell or higher
						&& hightierused[i-5]//already used a high level spell slot of this level
						)
			)//spell can't be used
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
		buttons+="<button disabled=\"true\" class=\"recovered\">Arcane Recovery regained Level "+lvl+" Spellslot</button>"
	}
	document.getElementById("recovered").innerHTML=buttons;
	
	document.getElementById("recover_levels").innerHTML=recover_levels;
	
}
