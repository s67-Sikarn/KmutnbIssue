import re

with open('Issue/templates/dashboard.html', 'r') as f:
    content = f.read()

# 1. Add Modal CSS
if "/* 3D Modal Styles */" not in content:
    style_block = """    <style>
        #modal-3d { display: none; }
        #modal-3d.active { display: flex; }
        .room-label { pointer-events: none; }
    </style>
"""
    content = content.replace("    <script src=\"https://cdn.tailwindcss.com\"></script>\n", 
                              f"    <script src=\"https://cdn.tailwindcss.com\"></script>\n{style_block}")

# 2. Add View 3D Map button to Issue Cards
button_html = """
                    <div class="mt-3 flex justify-end">
                        <button type="button" onclick="open3DMapDashboard('{{ issue.bld }}', '{{ issue.flr }}', '{{ issue.rm }}')" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-1.5 px-3 rounded text-xs font-medium transition flex items-center gap-1 border border-indigo-200">
                            <i class="fas fa-map-marked-alt"></i> View on 3D Map
                        </button>
                    </div>
"""
if 'View on 3D Map' not in content:
    content = content.replace("</span>\n                    </div>\n                    <p class=\"text-sm text-gray-700 bg-gray-50 p-3 rounded-md line-clamp-3\"",
                              f"</span>\n                    </div>{button_html}                    <p class=\"text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-md line-clamp-3\"")

# 3. Add Modal HTML and JS logic at the bottom
modal_and_js = """
    <!-- 3D Map Modal (Viewer) -->
    <div id="modal-3d" class="fixed inset-0 z-[100] bg-black bg-opacity-50 items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col overflow-hidden animate-fade-in relative">
            <div class="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                <h3 class="text-lg font-semibold text-gray-800" id="map-title-dash">
                    <i class="fas fa-map-marked-alt text-indigo-600 mr-2"></i> 3D Issue Location
                </h3>
                <button type="button" onclick="close3DMap()" class="text-gray-400 hover:text-gray-600 transition">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div id="map-container" class="w-full relative bg-gray-200" style="height: 60vh; min-height: 400px;">
                <div id="map-loader" class="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10 flex-col">
                    <i class="fas fa-circle-notch fa-spin text-4xl text-indigo-500 mb-2"></i>
                    <span class="text-indigo-600 font-medium">Loading 3D Map...</span>
                </div>
            </div>
            <div class="p-3 bg-gray-100 text-sm text-center text-gray-600 border-t">Issue location is highlighted in red. Other areas are ghosted. (Mock Data)</div>
        </div>
    </div>

    <!-- Three.js Import map -->
    <script type="importmap">
      {
        "imports": {
          "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
          "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
      }
    </script>
    <script type="module">
        import { initViewerMode, resizeModalCanvas } from "{% static '3d_map.js' %}";
        
        window.open3DMapDashboard = function(bld, flr, rm) {
            const modal = document.getElementById('modal-3d');
            const loader = document.getElementById('map-loader');
            const title = document.getElementById('map-title-dash');
            
            title.innerHTML = `<i class="fas fa-map-marked-alt text-indigo-600 mr-2"></i> Issue Location: Bld ${bld} | Flr ${flr} | Rm ${rm}`;
            
            modal.classList.add('active');
            loader.style.display = 'flex';
            
            setTimeout(() => {
                initViewerMode('map-container', bld, flr, rm);
                loader.style.display = 'none';
                resizeModalCanvas();
            }, 300);
        };
        
        window.close3DMap = function() {
            document.getElementById('modal-3d').classList.remove('active');
        };
        
        window.addEventListener('resize', () => {
             if(document.getElementById('modal-3d').classList.contains('active')) {
                 import("{% static '3d_map.js' %}").then(module => {
                     module.resizeModalCanvas();
                 });
             }
        });
    </script>
"""
if 'open3DMapDashboard' not in content:
    content = content.replace("</body>", f"{modal_and_js}</body>")

with open('Issue/templates/dashboard.html', 'w') as f:
    f.write(content)
