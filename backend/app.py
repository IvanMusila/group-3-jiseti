from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Your routes and configurations
    @app.route('/')
    def hello():
        return 'Hello World!'
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
