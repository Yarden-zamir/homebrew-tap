# typed: false
# frozen_string_literal: true

class ZshActCompletion < Formula
  desc "Zsh completions for act (for github)"
  homepage "https://github.com/Yarden-zamir/zsh-act-completion"
  url "https://github.com/Yarden-zamir/zsh-act-completion/archive/v0.0.27.tar.gz"
  sha256 "e51ce19c04f4a32be963ba8fe2c2f3b5cefeee44522adb2c0b3ebc4c1430dc27"
  license "MIT"

  def install
    zsh_completion.install "zsh/_act" => "_act"
  end
end
