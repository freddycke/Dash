var res = {
    HelloWorld_png : "res/HelloWorld.png",
    character_png : "res/Character/character.png",
    tilemap_tmx:"res/Maps/Level1.tmx"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}
