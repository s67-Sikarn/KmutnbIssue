import re

with open('Issue/templates/index.html', 'r') as f:
    content = f.read()

# 1. Add style for modal and room-label
style_block = """    <style>
        /* 3D Modal Styles */
        #modal-3d { display: none; }
        #modal-3d.active { display: flex; }
        /* Label styles for CSS2D */
        .room-label { pointer-events: none; }
    </style>
"""
if '<style>' not in content:
    content = content.replace("    <script src=\"https://cdn.tailwindcss.com\"></script>\n", 
                              f"    <script src=\"https://cdn.tailwindcss.com\"></script>\n{style_block}")

# 2. Add Open 3D Map button
button_html = """                <div class="flex justify-end mb-2">
                    <button type="button" onclick="open3DMapReporter()" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-1.5 px-3 rounded-md text-sm font-medium transition flex items-center gap-1 border border-indigo-200">
                        <i class="fas fa-map-marked-alt"></i> Open 3D Map
                    </button>
                </div>
"""
if 'Open 3D Map' not in content:
    content = content.replace('                <div class="loc-row">', f"{button_html}                <div class=\"loc-row\">")

# 3. Add Modal HTML
modal_html = """    <!-- 3D Map Modal (Reporter) -->
    <div id="modal-3d" class="fixed inset-0 z-[100] bg-black bg-opacity-50 items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col overflow-hidden animate-fade-in relative">
            <div class="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                <h3 class="text-lg font-semibold text-gray-800">
                    <i class="fas fa-map-marked-alt text-indigo-600 mr-2"></i> Select Location on 3D Map
                </h3>
                <button type="button" onclick="close3DMap()" class="text-gray-400 hover:text-gray-600 transition">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <!-- 3D Canvas Container -->
            <div id="map-container" class="w-full relative bg-gray-200" style="height: 60vh; min-height: 400px;">
                <!-- Loader Placeholder -->
                <div id="map-loader" class="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10 flex-col">
                    <i class="fas fa-circle-notch fa-spin text-4xl text-indigo-500 mb-2"></i>
                    <span class="text-indigo-600 font-medium">Loading 3D Map...</span>
                </div>
            </div>
            <div class="p-3 bg-gray-100 text-sm text-center text-gray-600 border-t">Hover to highlight. Click on a room to select it. (Mock Data)</div>
        </div>
    </div>

"""
if 'modal-3d' not in content:
    content = content.replace("    <!-- ส่วนแจ่งเตือนแบบ Toast มุมขวาล่าง -->", f"{modal_html}    <!-- ส่วนแจ่งเตือนแบบ Toast มุมขวาล่าง -->")

# 4. Add JS logic
script_html = """
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
        import { initReporterMode, resizeModalCanvas } from "{% static '3d_map.js' %}";
        
        window.open3DMapReporter = function() {
            const modal = document.getElementById('modal-3d');
            const loader = document.getElementById('map-loader');
            const bldVal = document.getElementById('bld').value;
            const flrVal = document.getElementById('flr').value;
            
            modal.classList.add('active');
            loader.style.display = 'flex';
            
            // Allow modal to display before initializing Three.js to guarantee clientWidth > 0
            setTimeout(() => {
                initReporterMode('map-container', function(selectedRoomData) {
                    // Auto-fill form
                    document.getElementById('bld').value = selectedRoomData.bld;
                    document.getElementById('flr').value = selectedRoomData.flr;
                    document.getElementById('rm').value = selectedRoomData.rm;
                    
                    // Trigger the onLocChange to update dependent logic (if any)
                    if(typeof window.onLocChange === 'function') window.onLocChange();
                                        
                    // Show success toast
                    if(typeof showToast === 'function') {
                        showToast('✅', `Selected Room: ${selectedRoomData.rm}`);
                    }
                    
                    close3DMap();
                });
                loader.style.display = 'none';
                
                // CRITICAL: Update sizing immediately after initialization
                resizeModalCanvas();
            }, 300);
        };
        
        window.close3DMap = function() {
            document.getElementById('modal-3d').classList.remove('active');
        };
        
        // Ensure resize works if window changes while modal is open
        window.addEventListener('resize', () => {
             if(document.getElementById('modal-3d').classList.contains('active')) {
                 resizeModalCanvas();
             }
        });
    </script>
"""
if 'open3DMapReporter' not in content:
    content = content.replace("</body>", f"{script_html}</body>")

with open('Issue/templates/index.html', 'w') as f:
    f.write(content)
